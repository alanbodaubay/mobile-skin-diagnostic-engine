import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Button, TextField, Checkbox, FormControlLabel, 
  Alert, Chip, LinearProgress, Card, CardContent, Dialog, DialogTitle, 
  DialogContent, DialogActions, Tabs, Tab 
} from '@mui/material';
import { DEMO_INSTAGRAM_POSTS, createPostsFromFiles, runInstagramBatchAnalysis } from '../services/instagramService';
import RecommendationCard from './RecommendationCard';
import { saveScanRecord } from '../services/historyStorage';

export default function InstagramAnalysis({ faceMeshRef, onScanSaved }) {
  const [hasConsent, setHasConsent] = useState(false);
  const [handle, setHandle] = useState('@alan_skincare');
  const [sourceMode, setSourceMode] = useState('demo'); // 'demo' or 'upload'
  const [posts, setPosts] = useState(DEMO_INSTAGRAM_POSTS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, statusText: '' });
  const [auditReport, setAuditReport] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle uploading client photos
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPosts = createPostsFromFiles(files);
      setPosts(newPosts);
      setAuditReport(null);
    }
  };

  // Reset to demo feed
  const handleLoadDemo = () => {
    setPosts(DEMO_INSTAGRAM_POSTS);
    setAuditReport(null);
  };

  // Run the batch analysis
  const handleStartScan = async () => {
    const faceMesh = faceMeshRef?.current;
    if (!hasConsent || !faceMesh) return;
    setIsScanning(true);
    setAuditReport(null);
    setSaveSuccess(false);

    try {
      const report = await runInstagramBatchAnalysis(
        posts,
        faceMesh,
        (currentIndex, total, currentPost) => {
          setScanProgress({
            current: currentIndex,
            total,
            statusText: currentPost ? `Analyzing ${currentPost.date}...` : 'Wrapping up audit...',
          });
          // Update post status live in UI
          setPosts((prev) =>
            prev.map((p) => (p.id === currentPost?.id ? { ...p, status: currentPost.status } : p))
          );
        }
      );

      setAuditReport(report);
      setPosts(report.posts);

      // Auto-save the latest face post from the audit to local history
      const latestFacePost = [...report.posts].reverse().find((p) => p.status === 'completed');
      if (latestFacePost && latestFacePost.diagnosis) {
        try {
          await saveScanRecord({
            metrics: latestFacePost.metrics,
            skinType: latestFacePost.skinType,
            recommendation: latestFacePost.recommendation,
            rois: latestFacePost.rois,
            detectedConcerns: [
              `Instagram Audit (${handle})`,
              ...(latestFacePost.diagnosis.detectedConcerns || []),
            ],
          });
          setSaveSuccess(true);
          if (onScanSaved) onScanSaved();
        } catch (err) {
          console.warn('Could not auto-save audit to history:', err);
        }
      }
    } catch (err) {
      console.error('Batch scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const completedPosts = posts.filter((p) => p.status === 'completed');

  return (
    <Box mt={2}>
      {/* Header Banner */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="h5" fontWeight={800} color="#1A1A2E">
            Instagram Client Skin Audit
          </Typography>
          <Chip 
            label="NEW • Frank & Linda Feature" 
            size="small" 
            sx={{ bgcolor: '#FF1493', color: '#FFF', fontWeight: 700, fontSize: '0.75rem' }} 
          />
        </Box>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Analyze a client's social feed photos with explicit consent to detect longitudinal skin recovery trends over time.
        </Typography>
      </Box>

      {/* 1. Explicit Consent & Privacy Agreement Card */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2.5, 
          mb: 3, 
          borderRadius: 3, 
          bgcolor: hasConsent ? '#F1FDF5' : '#FFF9F5',
          border: hasConsent ? '2px solid #81C784' : '2px solid #FFAB91',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color={hasConsent ? '#2E7D32' : '#D84315'} gutterBottom>
          🔒 Client Consent & Privacy Authorization
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1.5} lineHeight={1.5}>
          To comply with privacy laws (GDPR, HIPAA, and FOREO brand standards), we require explicit client authorization before processing Instagram photos. All face landmarking and TensorFlow.js metric scoring run <strong>100% on-device</strong>. Zero image data is ever uploaded to any cloud server.
        </Typography>

        <FormControlLabel
          control={
            <Checkbox 
              checked={hasConsent} 
              onChange={(e) => setHasConsent(e.target.checked)} 
              color="primary"
            />
          }
          label={
            <Typography variant="body2" fontWeight={700} color="#1A1A2E">
              I consent to FOREO Skin Diagnostic Engine inspecting my Instagram feed photos to evaluate skin health trends.
            </Typography>
          }
        />
      </Paper>

      {/* 2. Source Selection (Demo Handle vs Client File Upload) */}
      <Paper elevation={1} sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: '#FFF' }}>
        <Tabs 
          value={sourceMode} 
          onChange={(e, val) => setSourceMode(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="📱 Demo Instagram Feed (@handle)" value="demo" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="📂 Upload Client Instagram Photos" value="upload" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        {sourceMode === 'demo' ? (
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <TextField 
              label="Instagram Username" 
              value={handle} 
              onChange={(e) => setHandle(e.target.value)}
              size="small"
              sx={{ width: 220 }}
            />
            <Button variant="outlined" size="medium" onClick={handleLoadDemo} sx={{ textTransform: 'none' }}>
              Reset Demo Feed (6 Posts)
            </Button>
            <Typography variant="caption" color="text.secondary">
              Includes 4 facial timeline photos + 2 lifestyle shots to demonstrate smart face filtering.
            </Typography>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Button variant="contained" component="label" size="medium" sx={{ bgcolor: '#FF1493' }}>
              Select Multiple Photos (3–10)
              <input type="file" hidden multiple accept="image/*" onChange={handleFileUpload} />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Photos will be arranged into a simulated Instagram chronological timeline.
            </Typography>
          </Box>
        )}

        <Box mt={2.5}>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            disabled={!hasConsent || isScanning}
            onClick={handleStartScan}
            sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: 2 }}
          >
            {isScanning ? 'Scanning Instagram Feed...' : `⚡ Run Edge-AI Audit (${posts.length} Posts)`}
          </Button>
          {!hasConsent && (
            <Typography variant="caption" color="error" display="block" mt={1}>
              * Please check the consent authorization above to enable scanning.
            </Typography>
          )}
        </Box>

        {isScanning && (
          <Box mt={3}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" fontWeight={700} color="secondary">
                {scanProgress.statusText}
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {scanProgress.current} / {scanProgress.total} posts
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(scanProgress.current / (scanProgress.total || 1)) * 100} 
              color="secondary"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </Paper>

      {/* 3. Instagram Social Audit Report (Displays when audit complete) */}
      {auditReport && (
        <Box mb={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFF', border: '2px solid #FF1493' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="overline" color="secondary" fontWeight={800} letterSpacing={1}>
                  AUDIT COMPLETE • {handle}
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#1A1A2E">
                  Instagram Longitudinal Skin Report
                </Typography>
              </Box>
              {saveSuccess && (
                <Chip label="✓ Auto-Saved to Scan History" color="success" size="small" sx={{ fontWeight: 700 }} />
              )}
            </Box>

            {/* Verdict Alert */}
            <Alert severity="info" sx={{ mb: 3, fontWeight: 600 }}>
              {auditReport.summary.overallVerdict}
            </Alert>

            {/* Metric Summary Cards */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(4, 1fr)' }} gap={2} mb={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#FAFAFC' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>POSTS AUDITED</Typography>
                <Typography variant="h4" fontWeight={800} color="primary">{auditReport.summary.totalPosts}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {auditReport.summary.facePostsCount} Face • {auditReport.summary.skippedCount} Non-Face
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#FFF5F5' }}>
                <Typography variant="caption" color="#C62828" fontWeight={700}>REDNESS CHANGE</Typography>
                <Typography variant="h4" fontWeight={800} color="#C62828">
                  {auditReport.summary.rednessDelta <= 0 ? `${auditReport.summary.rednessDelta}%` : `+${auditReport.summary.rednessDelta}%`}
                </Typography>
                <Typography variant="caption" color="text.secondary">Erythema Trend</Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#F0F7FF' }}>
                <Typography variant="caption" color="#1565C0" fontWeight={700}>SEBUM CHANGE</Typography>
                <Typography variant="h4" fontWeight={800} color="#1565C0">
                  {auditReport.summary.oilinessDelta <= 0 ? `${auditReport.summary.oilinessDelta}%` : `+${auditReport.summary.oilinessDelta}%`}
                </Typography>
                <Typography variant="caption" color="text.secondary">Oiliness Trend</Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#F1FDF5' }}>
                <Typography variant="caption" color="#2E7D32" fontWeight={700}>HEALTH PROGRESS</Typography>
                <Typography variant="h4" fontWeight={800} color="#2E7D32">
                  {auditReport.summary.healthDelta >= 0 ? `+${auditReport.summary.healthDelta}%` : `${auditReport.summary.healthDelta}%`}
                </Typography>
                <Typography variant="caption" color="text.secondary">Overall Skin Barrier</Typography>
              </Paper>
            </Box>

            {/* Timeline Progress Bar across Instagram Feed */}
            {completedPosts.length >= 2 && (
              <Box mb={3} p={2} sx={{ bgcolor: '#F9F9FB', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Skin Health Timeline Across Posts:
                </Typography>
                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  {completedPosts.map((cp, idx) => (
                    <Box key={cp.id} textAlign="center" flexGrow={1} minWidth={100}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {cp.date}
                      </Typography>
                      <Chip 
                        label={`Health: ${cp.healthScore}%`} 
                        size="small" 
                        color={idx === completedPosts.length - 1 ? 'success' : 'primary'} 
                        sx={{ fontWeight: 700, mt: 0.5 }} 
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Latest Recommended Device */}
            {completedPosts.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" fontWeight={700} color="#1A1A2E" gutterBottom>
                  Prescribed Routine for Latest Social Scan:
                </Typography>
                <RecommendationCard recommendation={completedPosts[completedPosts.length - 1].recommendation} />
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* 4. Instagram Feed 3x3 Photo Grid */}
      <Typography variant="h6" fontWeight={800} color="#1A1A2E" gutterBottom>
        Instagram Posts Grid ({posts.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2.5}>
        Click on any analyzed post to inspect its individual facial landmarks, cropped regions, and metrics.
      </Typography>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={2.5}>
        {posts.map((post) => (
          <Card 
            key={post.id} 
            variant="outlined" 
            sx={{ 
              borderRadius: 3, 
              overflow: 'hidden', 
              cursor: post.status === 'completed' ? 'pointer' : 'default',
              transition: 'transform 0.2s',
              '&:hover': post.status === 'completed' ? { transform: 'translateY(-4px)', boxShadow: 4 } : {},
              borderColor: post.status === 'completed' ? '#81C784' : post.status === 'skipped' ? '#FFCC80' : '#E0E0E0',
            }}
            onClick={() => post.status === 'completed' && setSelectedPost(post)}
          >
            {/* Header with date and status */}
            <Box p={1.5} display="flex" justifyContent="space-between" alignItems="center" bgcolor="#FAFAFA">
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {post.date}
              </Typography>
              {post.status === 'completed' && (
                <Chip label={`Health: ${post.healthScore}%`} size="small" color="success" sx={{ fontWeight: 700, height: 22 }} />
              )}
              {post.status === 'skipped' && (
                <Chip label="No Face (Skipped)" size="small" sx={{ bgcolor: '#FFE0B2', color: '#E65100', fontWeight: 600, height: 22 }} />
              )}
              {post.status === 'analyzing' && (
                <Chip label="Analyzing..." size="small" color="secondary" sx={{ fontWeight: 600, height: 22 }} />
              )}
              {post.status === 'pending' && (
                <Chip label="Ready" size="small" variant="outlined" sx={{ height: 22 }} />
              )}
            </Box>

            {/* Post Photo */}
            <Box sx={{ width: '100%', height: 240, overflow: 'hidden', bgcolor: '#000' }}>
              <img 
                src={post.imageSrc} 
                alt="Instagram post" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </Box>

            {/* Caption & Stats */}
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                <strong>{handle}</strong> {post.caption}
              </Typography>

              {post.status === 'completed' && (
                <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                  <Chip label={`Red: ${post.metrics?.Redness}%`} size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', height: 20, fontSize: '0.7rem' }} />
                  <Chip label={`Oil: ${post.metrics?.Oiliness}%`} size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', height: 20, fontSize: '0.7rem' }} />
                  <Chip label={`Tex: ${post.metrics?.Texture}%`} size="small" sx={{ bgcolor: '#F3E5F5', color: '#6A1B9A', height: 20, fontSize: '0.7rem' }} />
                </Box>
              )}

              {post.status === 'skipped' && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1} fontStyle="italic">
                  Non-facial post successfully filtered.
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 5. Detail Modal for Clicked Post */}
      <Dialog 
        open={Boolean(selectedPost)} 
        onClose={() => setSelectedPost(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedPost && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              Instagram Post Analysis • {selectedPost.date}
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={2} textAlign="center">
                <img 
                  src={selectedPost.imageSrc} 
                  alt="Post Detail" 
                  style={{ maxHeight: 280, maxWidth: '100%', borderRadius: 8 }} 
                />
              </Box>

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Extracted Skin Regions (Forehead, Cheeks, Chin):
              </Typography>
              {selectedPost.rois && (
                <Box display="flex" justifyContent="space-around" mb={2}>
                  {Object.entries(selectedPost.rois).map(([region, src]) => (
                    <Box key={region} textAlign="center">
                      <img src={src} alt={region} style={{ width: 64, height: 64, borderRadius: 6, border: '1px solid #CCC' }} />
                      <Typography variant="caption" display="block">{region}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Calculated Metrics:
              </Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1.5} mb={2}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FFF5F5' }}>
                  <Typography variant="caption" color="#C62828" fontWeight={700}>REDNESS</Typography>
                  <Typography variant="h5" fontWeight={800} color="#C62828">{selectedPost.metrics?.Redness}%</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F0F7FF' }}>
                  <Typography variant="caption" color="#1565C0" fontWeight={700}>OILINESS</Typography>
                  <Typography variant="h5" fontWeight={800} color="#1565C0">{selectedPost.metrics?.Oiliness}%</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FAF5FF' }}>
                  <Typography variant="caption" color="#6A1B9A" fontWeight={700}>TEXTURE</Typography>
                  <Typography variant="h5" fontWeight={800} color="#6A1B9A">{selectedPost.metrics?.Texture}%</Typography>
                </Paper>
              </Box>

              <Typography variant="subtitle2" fontWeight={700}>
                Detected Skin Profile: <Chip label={selectedPost.skinType} size="small" color="primary" sx={{ fontWeight: 700 }} />
              </Typography>
              <Typography variant="body2" color="secondary" fontWeight={600} mt={1}>
                Recommended Device: {selectedPost.recommendation?.primaryDevice?.name}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPost(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
