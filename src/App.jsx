import { useState, useRef, useEffect } from 'react';
import { Button, Container, Typography, Box, Paper, CircularProgress } from '@mui/material';

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsMessage, setResultsMessage] = useState("");
  const [rois, setRois] = useState({});
  const [scores, setScores] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);

  useEffect(() => {
    // FaceMesh
    const FaceMesh = window.FaceMesh;
    if (!FaceMesh) {
      console.error("FaceMesh not loaded");
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

    faceMesh.onResults((results) => {
      setIsAnalyzing(false);
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setResultsMessage("Face detected successfully! Landmarks mapped & regions cropped.");
        drawLandmarks(results.multiFaceLandmarks[0]);
        extractROIs(results.multiFaceLandmarks[0]);
      } else {
        setResultsMessage("No face detected in the image. Please try another photo.");
        setRois({});
        setScores(null);
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
    // tiny dots 
    landmarks.forEach((point) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const extractROIs = (landmarks) => {
    const img = imageRef.current;
    if (!img) return;

    // get pixels from the image
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    // crop a region and return both preview image + raw pixel data
    const cropPoint = (pointIndex, boxSize) => {
      const pt = landmarks[pointIndex];
      const cx = pt.x * nw;
      const cy = pt.y * nh;
      
      const size = boxSize;
      const sx = Math.max(0, cx - size / 2);
      const sy = Math.max(0, cy - size / 2);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = size;
      tempCanvas.height = size;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      return {
        src: tempCanvas.toDataURL('image/jpeg'),
        pixels: imageData.data, // raw RGBA pixel array
        width: size,
        height: size,
      };
    };

    const boxSize = Math.floor(nw * 0.15); 

    const newRois = {
      Forehead: cropPoint(151, boxSize),
      LeftCheek: cropPoint(205, boxSize),
      RightCheek: cropPoint(425, boxSize),
      Chin: cropPoint(152, boxSize),
    };

    // Preview images
    setRois({
      Forehead: newRois.Forehead.src,
      LeftCheek: newRois.LeftCheek.src,
      RightCheek: newRois.RightCheek.src,
      Chin: newRois.Chin.src,
    });


    // Image proccessing
    // Collect all pixel arrays from all regions
    const allRegions = [newRois.Forehead, newRois.LeftCheek, newRois.RightCheek, newRois.Chin];

    // Correct lightning conditions
    const normalizePixels = (regions) => {
      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      for (const region of regions) {
        const px = region.pixels;
        for (let i = 0; i < px.length; i += 4) {
          totalR += px[i];
          totalG += px[i + 1];
          totalB += px[i + 2];
          count++;
        }
      }
      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;
      
      const avgGray = (avgR + avgG + avgB) / 3;

      // Scaling factors to neutralize the color cast
      const scaleR = avgGray / (avgR || 1);
      const scaleG = avgGray / (avgG || 1);
      const scaleB = avgGray / (avgB || 1);

      // Apply the correction to a new copy of the pixel data
      return regions.map(region => {
        const newPixels = new Uint8ClampedArray(region.pixels);
        for (let i = 0; i < newPixels.length; i += 4) {
          newPixels[i] = Math.min(255, newPixels[i] * scaleR);
          newPixels[i+1] = Math.min(255, newPixels[i+1] * scaleG);
          newPixels[i+2] = Math.min(255, newPixels[i+2] * scaleB);
        }
        return { ...region, pixels: newPixels };
      });
    };

    const normalizedRegions = normalizePixels(allRegions);

    // Redness
    // Measures how dominant the red channel is relative to green and blue.
    // In skin, elevated redness indicates inflammation, irritation, or acne.
    const calcRedness = (regions) => {
      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      for (const region of regions) {
        const px = region.pixels;
        for (let i = 0; i < px.length; i += 4) {
          totalR += px[i];
          totalG += px[i + 1];
          totalB += px[i + 2];
          count++;
        }
      }
      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;
      // How much more R vs G+B
      // Neutral skin = 0.38-0.42, inflamed skin > 0.42
      const redRatio = avgR / (avgR + avgG + avgB);
      // Map 0.33 (neutral) to 0% and 0.50+ to 100%
      const score = Math.min(100, Math.max(0, Math.round(((redRatio - 0.33) / 0.17) * 100)));
      return score;
    };

    // Oiliness
    // Oily skin reflects light, creating pixels with high brightness (luminance)
    const calcOiliness = (regions) => {
      let shinyPixels = 0, totalPixels = 0;
      const SHINE_THRESHOLD = 180; // luminance value indicating specular highlight
      for (const region of regions) {
        const px = region.pixels;
        for (let i = 0; i < px.length; i += 4) {
          // Standard luminance formula (ITU-R BT.601)
          const luminance = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          if (luminance > SHINE_THRESHOLD) shinyPixels++;
          totalPixels++;
        }
      }
      // Shiny pixels
      const rawPercent = (shinyPixels / totalPixels) * 100;
      const score = Math.min(100, Math.max(0, Math.round(rawPercent * 5)));
      return score;
    };

    // Texture
    // Measures pixel-to-pixel variance using grayscale standard deviation.
    // Smooth skin has low variance (uniform color). Rough/textured skin (acne scars, pores, bumps) creates high local contrast = high variance.
    const calcTexture = (regions) => {
      let allLuminances = [];
      for (const region of regions) {
        const px = region.pixels;
        for (let i = 0; i < px.length; i += 4) {
          const luminance = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          allLuminances.push(luminance);
        }
      }
      // Calculate standard deviation of luminance
      const mean = allLuminances.reduce((a, b) => a + b, 0) / allLuminances.length;
      const variance = allLuminances.reduce((sum, val) => sum + (val - mean) ** 2, 0) / allLuminances.length;
      const stdDev = Math.sqrt(variance);
      // Map stdDev: 0-50 range to 0-100 score (higher = rougher texture)
      const score = Math.min(100, Math.max(0, Math.round((stdDev / 50) * 100)));
      return score;
    };

    const realScores = {
      Redness: calcRedness(normalizedRegions),
      Oiliness: calcOiliness(normalizedRegions),
      Texture: calcTexture(normalizedRegions),
    };
    setScores(realScores);

    // Recommendations
    if (realScores.Redness > 60) {
      setRecommendation({ 
        device: "FOREO ESPADA", 
        reason: `Your redness score is elevated (${realScores.Redness}%). ESPADA's blue LED light therapy is designed to target blemishes and calm skin inflammation.`
      });
    } else if (realScores.Oiliness > 50) {
      setRecommendation({ 
        device: "FOREO LUNA 4", 
        reason: `Your oiliness score is high (${realScores.Oiliness}%). LUNA's T-Sonic pulsations will help deeply cleanse pores and control excess sebum production.`
      });
    } else if (realScores.Texture > 50) {
      setRecommendation({ 
        device: "FOREO UFO 3", 
        reason: `We detected uneven skin texture (${realScores.Texture}%). UFO's deeply hydrating mask treatment will help smooth and nourish your skin.`
      });
    } else {
      setRecommendation({ 
        device: "FOREO BEAR", 
        reason: `Your skin metrics look healthy! BEAR's microcurrent facial toning will help maintain your natural glow and facial firmness.`
      });
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setResultsMessage("");
      setScores(null);
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

  const handleAnalyze = async () => {
    if (!imageSrc || !imageRef.current || !faceMeshRef.current) return;
    setIsAnalyzing(true);
    setResultsMessage("");
    try {
      await faceMeshRef.current.send({ image: imageRef.current });
    } catch (err) {
      console.error(err);
      setResultsMessage("Error analyzing image.");
      setIsAnalyzing(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom align="center">
        FOREO Skin Diagnostics
      </Typography>
      
      <Box display="flex" flexDirection="column" alignItems="center" gap={3} mt={4}>
        <Button variant="contained" component="label" size="large">
          Upload Photo
          <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
        </Button>

        {imageSrc && (
          <Paper elevation={3} sx={{ p: 2, mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <img 
                ref={imageRef} 
                src={imageSrc} 
                alt="Uploaded face" 
                style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '400px', display: 'block' }} 
              />
              <canvas 
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              />
            </div>
            
            <Button 
              variant="contained" 
              color="secondary" 
              sx={{ mt: 2 }} 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <CircularProgress size={24} /> : "Analyze Skin"}
            </Button>

            {resultsMessage && (
              <Typography variant="body1" color={resultsMessage.includes('Error') || resultsMessage.includes('No face') ? 'error' : 'success.main'} sx={{ mt: 2 }}>
                {resultsMessage}
              </Typography>
            )}

            {Object.keys(rois).length > 0 && (
              <Box mt={3} width="100%">
                <Typography variant="h6" gutterBottom>Regions of Interest (Ready for ML)</Typography>
                <Box display="flex" justifyContent="space-around" flexWrap="wrap" gap={2}>
                  {Object.entries(rois).map(([region, src]) => (
                    <Box key={region} display="flex" flexDirection="column" alignItems="center">
                      <img src={src} alt={region} style={{ width: 80, height: 80, borderRadius: 8, border: '2px solid #ccc' }} />
                      <Typography variant="caption" sx={{ mt: 1 }}>{region}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {scores && recommendation && (
              <Box mt={4} width="100%">
                <Typography variant="h5" gutterBottom color="primary">AI Skin Analysis</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                  <Typography variant="body1"><strong>Redness:</strong> {scores.Redness}%</Typography>
                  <Typography variant="body1"><strong>Oiliness:</strong> {scores.Oiliness}%</Typography>
                  <Typography variant="body1"><strong>Uneven Texture:</strong> {scores.Texture}%</Typography>
                </Paper>

                <Typography variant="h5" gutterBottom color="secondary">FOREO Recommendation</Typography>
                <Paper variant="elevation" elevation={4} sx={{ p: 3, bgcolor: '#fff0f5' }}>
                  <Typography variant="h6" gutterBottom>{recommendation.device}</Typography>
                  <Typography variant="body1">{recommendation.reason}</Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default App;