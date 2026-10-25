import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, Container, Typography, Box, Paper, CircularProgress, Alert, Chip, Snackbar 
} from '@mui/material';
import Header from './components/Header';
import RecommendationCard from './components/RecommendationCard';
import HistoryDashboard from './components/HistoryDashboard';
import CatalogView from './components/CatalogView';
import InstagramAnalysis from './components/InstagramAnalysis';
import { runSkinDiagnostics } from './services/aiModelService';
import { getForeoRecommendation } from './services/foreoCatalog';
import { saveScanRecord } from './services/historyStorage';

function App() {
  const [currentTab, setCurrentTab] = useState('scan');
  const [imageSrc, setImageSrc] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsMessage, setResultsMessage] = useState('');
  const [rois, setRois] = useState({});
  const [aiResults, setAiResults] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const processHandlerRef = useRef(null);
  const drawHandlerRef = useRef(null);

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    const FaceMesh = window.FaceMesh;
    if (!FaceMesh) {
      console.error('MediaPipe FaceMesh not loaded from CDN');
      return;
    }
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(async (results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setResultsMessage('Face detected! Running 100% on-device TensorFlow.js inference...');
        if (drawHandlerRef.current) {
          drawHandlerRef.current(results.multiFaceLandmarks[0]);
        }
        if (processHandlerRef.current) {
          await processHandlerRef.current(results.multiFaceLandmarks[0]);
        }
      } else {
        setIsAnalyzing(false);
        setResultsMessage('No face detected in the image. Please use a clear, front-facing photo.');
        setRois({});
        setAiResults(null);
        setRecommendation(null);
      }
    });

    faceMeshRef.current = faceMesh;
  }, []);

  const drawLandmarks = (landmarks) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00FF00';
    landmarks.forEach((point) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  /**
   * Crops 4 key anatomical skin regions (Forehead, Left Cheek, Right Cheek, Chin)
   * and runs Gray World auto white-balance normalization before AI feature extraction.
   */
  const processAndDiagnose = async (landmarks) => {
    const img = imageRef.current;
    if (!img) {
      setIsAnalyzing(false);
      return;
    }

    const nw = img.naturalWidth || 640;
    const nh = img.naturalHeight || 480;
    const boxSize = Math.max(32, Math.floor(Math.min(nw, nh) * 0.15));

    const cropPoint = (pointIndex) => {
      const pt = landmarks[pointIndex];
      const cx = pt.x * nw;
      const cy = pt.y * nh;
      
      const size = Math.min(boxSize, nw, nh);
      const sx = Math.max(0, Math.min(Math.floor(cx - size / 2), nw - size));
      const sy = Math.max(0, Math.min(Math.floor(cy - size / 2), nh - size));
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = size;
      tempCanvas.height = size;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      return {
        src: tempCanvas.toDataURL('image/jpeg'),
        pixels: imageData.data,
        width: size,
        height: size,
      };
    };

    const rawRois = {
      Forehead: cropPoint(151),
      LeftCheek: cropPoint(205),
      RightCheek: cropPoint(425),
      Chin: cropPoint(152),
    };

    // Update image previews in UI
    setRois({
      Forehead: rawRois.Forehead.src,
      LeftCheek: rawRois.LeftCheek.src,
      RightCheek: rawRois.RightCheek.src,
      Chin: rawRois.Chin.src,
    });

    // Global Gray World Illuminant Estimation:
    // Samples the ambient lighting cast from the global frame rather than isolated skin patches,
    // neutralizing color temperature without mathematically wiping out regional erythema/redness.
    const sampleGlobalIlluminant = () => {
      const sampleCanvas = document.createElement('canvas');
      const sampleSize = 64;
      sampleCanvas.width = sampleSize;
      sampleCanvas.height = sampleSize;
      const sctx = sampleCanvas.getContext('2d');
      sctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imgData = sctx.getImageData(0, 0, sampleSize, sampleSize).data;

      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        totalR += imgData[i];
        totalG += imgData[i + 1];
        totalB += imgData[i + 2];
        count++;
      }
      const avgR = totalR / (count || 1);
      const avgG = totalG / (count || 1);
      const avgB = totalB / (count || 1);
      const avgGray = (avgR + avgG + avgB) / 3;

      // Bound chromatic scaling factors to [0.75, 1.35] to prevent chromatic divergence
      const scaleR = Math.min(1.35, Math.max(0.75, avgGray / (avgR || 1)));
      const scaleG = Math.min(1.35, Math.max(0.75, avgGray / (avgG || 1)));
      const scaleB = Math.min(1.35, Math.max(0.75, avgGray / (avgB || 1)));
      return { scaleR, scaleG, scaleB };
    };

    const { scaleR, scaleG, scaleB } = sampleGlobalIlluminant();

    const normalizeRegion = (region) => {
      const px = region.pixels;
      const newPixels = new Uint8ClampedArray(px.length);
      for (let i = 0; i < px.length; i += 4) {
        newPixels[i] = Math.min(255, px[i] * scaleR);
        newPixels[i + 1] = Math.min(255, px[i + 1] * scaleG);
        newPixels[i + 2] = Math.min(255, px[i + 2] * scaleB);
        newPixels[i + 3] = px[i + 3];
      }
      return { ...region, pixels: newPixels };
    };

    const normalizedRois = {
      Forehead: normalizeRegion(rawRois.Forehead),
      LeftCheek: normalizeRegion(rawRois.LeftCheek),
      RightCheek: normalizeRegion(rawRois.RightCheek),
      Chin: normalizeRegion(rawRois.Chin),
    };

    try {
      // 1. Run On-Device TensorFlow.js ML Diagnostics
      const results = await runSkinDiagnostics(normalizedRois);
      setAiResults(results);

      // 2. Run Offline FOREO Recommendation Engine
      const rec = getForeoRecommendation(results.metrics, results.skinType, results.detectedConcerns);
      setRecommendation(rec);

      // 3. Auto-save scan to IndexedDB in isolated try/catch so storage never blocks UI
      try {
        await saveScanRecord({
          metrics: results.metrics,
          skinType: results.skinType,
          recommendation: rec,
          rois: {
            Forehead: rawRois.Forehead.src,
            LeftCheek: rawRois.LeftCheek.src,
            RightCheek: rawRois.RightCheek.src,
            Chin: rawRois.Chin.src,
          },
          detectedConcerns: results.detectedConcerns,
        });
        setSnackbarMsg('Scan successfully analyzed and saved to local history!');
        setSnackbarOpen(true);
      } catch (storageErr) {
        console.warn('Storage save skipped:', storageErr);
      }

      setResultsMessage('Edge-AI Diagnosis Complete! Review your metrics and routine below.');
    } catch (err) {
      console.error('Diagnostic error:', err);
      setResultsMessage(`Diagnostic error: ${err?.message || 'Error processing skin features'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    drawHandlerRef.current = drawLandmarks;
    processHandlerRef.current = processAndDiagnose;
  });

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setResultsMessage('');
      setAiResults(null);
      setRecommendation(null);
      setRois({});
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSample = () => {
    setResultsMessage('');
    setAiResults(null);
    setRecommendation(null);
    setRois({});
    setImageSrc('/sample_face.png');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleAnalyze = async () => {
    if (!imageSrc || !imageRef.current || !faceMeshRef.current) return;
    setIsAnalyzing(true);
    setResultsMessage('Detecting 468 facial landmarks with MediaPipe...');
    try {
      await faceMeshRef.current.send({ image: imageRef.current });
    } catch (err) {
      console.error(err);
      setResultsMessage(`Analysis error: ${err?.message || 'Error analyzing image'}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#F4F5F9', minHeight: '100vh', pb: 8 }}>
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />

      <Container maxWidth="md" sx={{ mt: 3 }}>
        {/* TAB 1: Scan & Diagnose */}
        {currentTab === 'scan' && (
          <Box display="flex" flexDirection="column" alignItems="center">
            {/* Upload & Actions */}
            <Paper elevation={1} sx={{ p: 3, width: '100%', borderRadius: 3, textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={800} color="#1A1A2E" gutterBottom>
                On-Device Skin Health Diagnostic Scan
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3} maxWidth={520} mx="auto">
                Powered by MediaPipe 468 Face Mesh & client-side TensorFlow.js. Your photos never leave your device.
              </Typography>

              <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                <Button variant="contained" component="label" size="large" sx={{ bgcolor: '#FF1493', '&:hover': { bgcolor: '#D81B60' }, px: 3 }}>
                  📸 Upload / Take Photo
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
                <Button variant="outlined" color="primary" size="large" onClick={handleUseSample} sx={{ px: 3 }}>
                  👤 Try Sample Face Photo
                </Button>
              </Box>
            </Paper>

            {/* Viewfinder Preview */}
            {imageSrc && (
              <Paper elevation={3} sx={{ p: 2.5, width: '100%', borderRadius: 3, bgcolor: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', maxWidth: 460, width: '100%', borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img 
                    ref={imageRef} 
                    src={imageSrc} 
                    alt="Facial Capture" 
                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                  />
                  <canvas 
                    ref={canvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  />
                </Box>
                
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  sx={{ mt: 2.5, px: 4, py: 1.2, fontWeight: 700, borderRadius: 2 }} 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <CircularProgress size={24} color="inherit" /> : '⚡ Analyze Skin with Edge-AI'}
                </Button>

                {resultsMessage && (
                  <Alert 
                    severity={resultsMessage.includes('Error') || resultsMessage.includes('No face') ? 'error' : 'success'} 
                    sx={{ mt: 2, width: '100%', maxWidth: 460 }}
                  >
                    {resultsMessage}
                  </Alert>
                )}

                {/* Regions of Interest Preview */}
                {Object.keys(rois).length > 0 && (
                  <Box mt={3} width="100%">
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                      EXTRACTED REGIONS OF INTEREST (NORMALIZED):
                    </Typography>
                    <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={1.5}>
                      {Object.entries(rois).map(([region, src]) => (
                        <Box key={region} textAlign="center" p={1} sx={{ bgcolor: '#F8F9FA', borderRadius: 2, border: '1px solid #EAEAEA' }}>
                          <img src={src} alt={region} style={{ width: '100%', maxWidth: 70, height: 'auto', aspectRatio: '1/1', borderRadius: 6, display: 'block', margin: '0 auto' }} />
                          <Typography variant="caption" display="block" mt={0.5} fontWeight={600}>
                            {region}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Quantitative AI Skin Scores Dashboard */}
                {aiResults && (
                  <Box mt={4} width="100%">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
                      <Typography variant="h5" fontWeight={800} color="#1A1A2E">
                        On-Device Diagnostic Results
                      </Typography>
                      <Chip label={aiResults.skinType} color="primary" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Engine: {aiResults.engine} • Confidence: {aiResults.confidence}%
                    </Typography>

                    {/* Metric Cards Grid */}
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(4, 1fr)' }} gap={1.5} mb={2.5}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#FFF5F5', borderColor: '#FFCDD2' }}>
                        <Typography variant="caption" color="#C62828" fontWeight={700}>ERYTHEMA / REDNESS</Typography>
                        <Typography variant="h4" fontWeight={800} color="#C62828">{aiResults.metrics.Redness}%</Typography>
                        <Typography variant="caption" color="text.secondary">Vascular Irritation</Typography>
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#F0F7FF', borderColor: '#BBDEFB' }}>
                        <Typography variant="caption" color="#1565C0" fontWeight={700}>SEBUM / OILINESS</Typography>
                        <Typography variant="h4" fontWeight={800} color="#1565C0">{aiResults.metrics.Oiliness}%</Typography>
                        <Typography variant="caption" color="text.secondary">Specular Reflectance</Typography>
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#FAF5FF', borderColor: '#E1BEE7' }}>
                        <Typography variant="caption" color="#6A1B9A" fontWeight={700}>MICRO-RELIEF TEXTURE</Typography>
                        <Typography variant="h4" fontWeight={800} color="#6A1B9A">{aiResults.metrics.Texture}%</Typography>
                        <Typography variant="caption" color="text.secondary">Pores & Roughness</Typography>
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#F1FDF5', borderColor: '#C8E6C9' }}>
                        <Typography variant="caption" color="#2E7D32" fontWeight={700}>HEALTH INDEX</Typography>
                        <Typography variant="h4" fontWeight={800} color="#2E7D32">{aiResults.metrics.HealthScore}%</Typography>
                        <Typography variant="caption" color="text.secondary">Overall Barrier Balance</Typography>
                      </Paper>
                    </Box>

                    {/* Detected Clinical Concerns */}
                    <Box sx={{ bgcolor: '#FFFDE7', p: 2, borderRadius: 2, border: '1px solid #FFF59D', mb: 2 }}>
                      <Typography variant="caption" color="#F57F17" fontWeight={700} display="block" mb={0.5}>
                        DETECTED CLINICAL CONCERNS:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {aiResults.detectedConcerns.map((c, i) => (
                          <Chip key={i} label={c} size="small" sx={{ bgcolor: '#FFF9C4', color: '#F57F17', fontWeight: 600 }} />
                        ))}
                      </Box>
                    </Box>

                    {/* FOREO Recommendation Card (Week 6 Deliverable) */}
                    {recommendation && (
                      <RecommendationCard recommendation={recommendation} />
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}

        {/* TAB 2: Instagram Audit (Frank & Linda Week 8 Deliverable) */}
        {currentTab === 'instagram' && (
          <InstagramAnalysis 
            faceMeshRef={faceMeshRef} 
            onScanSaved={() => {
              setSnackbarMsg('Instagram audit progress successfully saved to history!');
              setSnackbarOpen(true);
            }} 
          />
        )}

        {/* TAB 3: Progress & History (Week 7 Deliverable) */}
        {currentTab === 'history' && (
          <HistoryDashboard onStartNewScan={() => setCurrentTab('scan')} />
        )}

        {/* TAB 4: FOREO Device Catalog */}
        {currentTab === 'catalog' && (
          <CatalogView />
        )}
      </Container>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Box>
  );
}

export default App;