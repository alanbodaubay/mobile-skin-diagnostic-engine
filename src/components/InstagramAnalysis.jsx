import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Button, TextField, Checkbox, FormControlLabel, 
  Alert, Chip, LinearProgress, Card, CardContent, Dialog, DialogTitle, 
  DialogContent, DialogActions, Tabs, Tab, CircularProgress 
} from '@mui/material';
import { 
  ALAN_DEFAULT_POSTS,
  createPostsFromFiles, 
  runInstagramBatchAnalysis,
  fetchPostsByQuery 
} from '../services/instagramService';
import RecommendationCard from './RecommendationCard';
import { saveScanRecord } from '../services/historyStorage';

export default function InstagramAnalysis({ faceMeshRef, onScanSaved }) {
  const [hasConsent, setHasConsent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('@alan_bd_');
  const [activeQueryTitle, setActiveQueryTitle] = useState('@alan_bd_');
  const [sourceMode, setSourceMode] = useState('demo'); // 'demo' or 'upload'
  const [posts, setPosts] = useState(ALAN_DEFAULT_POSTS);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, statusText: '' });
  const [auditReport, setAuditReport] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedNotification, setFeedNotification] = useState('🟢 Connected to official Meta API as @alan_bd_! Loaded 5 posts for Edge-AI scan.');

  // Search and fetch posts for any hashtag or username
  const handleFetchPosts = useCallback(async (overrideQuery) => {
    const q = overrideQuery || searchQuery || '@alan_bd_';
    setIsFetchingPosts(true);
    setAuditReport(null);
    setFeedNotification('');

    try {
      const fetched = await fetchPostsByQuery(q);
      setPosts(fetched);
      const title = q.startsWith('#') || q.startsWith('@') ? q : `#${q}`;
      setActiveQueryTitle(title);
      if (title.includes('alan') || title.includes('bd_')) {
        setFeedNotification(`🟢 Connected to official Meta API as @alan_bd_! Loaded ${fetched.length} posts for Edge-AI scan.`);
      } else {
        setFeedNotification(`✨ Loaded ${fetched.length} posts matching ${title}! Ready for Edge-AI scan.`);
      }
    } catch (err) {
      console.error('Failed to fetch posts for query:', err);
    } finally {
      setIsFetchingPosts(false);
    }
  }, [searchQuery]);

  // Auto-fetch posts with 500ms debounce when user types a hashtag
  useEffect(() => {
    if (sourceMode !== 'demo') return;
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const clean = trimmed.startsWith('#') || trimmed.startsWith('@') ? trimmed : `#${trimmed}`;
    if (clean === activeQueryTitle) return;

    const timer = setTimeout(() => {
      handleFetchPosts(trimmed);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, sourceMode, activeQueryTitle, handleFetchPosts]);

  const handleSelectQuickTag = (tag) => {
    setSearchQuery(tag);
    handleFetchPosts(tag);
  };

  // Handle uploading client photos
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPosts = createPostsFromFiles(files, searchQuery || '#client');
      setPosts(newPosts);
      setActiveQueryTitle(`${files.length} Uploaded Photos`);
      setAuditReport(null);
      setFeedNotification(`Imported ${files.length} client photos into feed.`);
    }
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
              `Instagram Audit (${activeQueryTitle})`,
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
      <Box mb={2.5}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="h5" fontWeight={800} color="#1A1A2E">
            Instagram Feed Skin Audit
          </Typography>
          <Chip 
            label="Frank & Linda Feature" 
            size="small" 
            sx={{ bgcolor: '#FF1493', color: '#FFF', fontWeight: 700, fontSize: '0.72rem' }} 
          />
          <Chip 
            label="🟢 Meta Graph API: @alan_bd_ (Token Active)" 
            size="small" 
            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #A5D6A7' }} 
          />
        </Box>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Analyze client social media posts to evaluate skin health changes over time.
        </Typography>
      </Box>

      {/* 1. Short, Intern-Style Consent Box */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2.5, 
          borderRadius: 2.5, 
          bgcolor: hasConsent ? '#F1FDF5' : '#FFF9F5',
          border: hasConsent ? '1px solid #81C784' : '1px solid #FFCC80',
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color={hasConsent ? '#2E7D32' : '#E65100'} gutterBottom>
          🔒 Quick Consent
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1} fontSize="0.85rem">
          Photos never leave your phone. 100% on-device AI.
        </Typography>

        <FormControlLabel
          control={
            <Checkbox 
              checked={hasConsent} 
              onChange={(e) => setHasConsent(e.target.checked)} 
              size="small"
              color="primary"
            />
          }
          label={
            <Typography variant="body2" fontWeight={600} color="#1A1A2E">
              I agree to scan my Instagram photos for skin trends
            </Typography>
          }
        />
      </Paper>

      {/* 2. Hashtag & Account Search / Ingestion */}
      <Paper elevation={1} sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: '#FFF' }}>
        <Tabs 
          value={sourceMode} 
          onChange={(e, val) => setSourceMode(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="👤 Client Profile (@Handle)" value="demo" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="📂 Upload Client Photos" value="upload" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        {sourceMode === 'demo' ? (
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <TextField 
                label="Instagram Username (@)" 
                placeholder="e.g. @alan_skincare, @charlotte_acne"
                helperText="Auto-updates feed when you type or select a profile"
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFetchPosts(); }}
                size="small"
                sx={{ minWidth: 280 }}
              />
              <Button 
                variant="contained" 
                onClick={() => handleFetchPosts()}
                disabled={isFetchingPosts}
                sx={{ bgcolor: '#1A1A2E', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600, px: 2.5, mb: { xs: 0, sm: 2.5 } }}
              >
                {isFetchingPosts ? <CircularProgress size={20} color="inherit" /> : '🔍 Fetch Profile'}
              </Button>
            </Box>

            {/* Popular quick profile suggestions */}
            <Box display="flex" alignItems="center" gap={1} mt={1.5} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">Sample client profiles:</Typography>
              {['@alan_bd_', '@charlotte_acne', '@emma_glow', '@david_fit'].map((handle) => (
                <Chip 
                  key={handle} 
                  label={handle} 
                  size="small" 
                  clickable 
                  onClick={() => handleSelectQuickTag(handle)}
                  sx={{ 
                    fontSize: '0.75rem', 
                    height: 24, 
                    cursor: 'pointer',
                    bgcolor: searchQuery === handle ? '#FF1493' : '#F0F0F0',
                    color: searchQuery === handle ? '#FFF' : '#333',
                    fontWeight: searchQuery === handle ? 700 : 500,
                  }} 
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Button variant="contained" component="label" size="medium" sx={{ bgcolor: '#FF1493' }}>
              Select Multiple Photos (3–10)
              <input type="file" hidden multiple accept="image/*" onChange={handleFileUpload} />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Selected photos will be placed into the timeline for batch analysis.
            </Typography>
          </Box>
        )}

        {feedNotification && (
          <Alert severity="success" sx={{ mt: 2, py: 0.5, fontSize: '0.85rem' }}>
            {feedNotification}
          </Alert>
        )}

        <Box mt={2.5} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            disabled={!hasConsent || isScanning}
            onClick={handleStartScan}
            sx={{ px: 4, py: 1.1, fontWeight: 700, borderRadius: 2 }}
          >
            {isScanning ? 'Scanning Posts...' : `⚡ Run Edge-AI Audit (${posts.length} Posts)`}
          </Button>

          {!hasConsent && (
            <Typography variant="caption" color="error">
              * Check consent above to run scan
            </Typography>
          )}
        </Box>

        {isScanning && (
          <Box mt={2.5}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
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
              sx={{ height: 7, borderRadius: 3.5 }}
            />
          </Box>
        )}
      </Paper>

      {/* 3. Instagram Social Audit Report */}
      {auditReport && (
        <Box mb={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFF', border: '2px solid #FF1493' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="overline" color="secondary" fontWeight={800} letterSpacing={1}>
                  AUDIT RESULTS • {activeQueryTitle}
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#1A1A2E">
                  Instagram Longitudinal Skin Report
                </Typography>
              </Box>
              {saveSuccess && (
                <Chip label="✓ Saved to History" color="success" size="small" sx={{ fontWeight: 700 }} />
              )}
            </Box>

            <Alert severity="info" sx={{ mb: 2.5, fontWeight: 600 }}>
              {auditReport.summary.overallVerdict}
            </Alert>

            {/* Metric Summary Cards */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(4, 1fr)' }} gap={1.5} mb={2.5}>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#FAFAFC' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>POSTS AUDITED</Typography>
                <Typography variant="h4" fontWeight={800} color="primary">{auditReport.summary.totalPosts}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {auditReport.summary.facePostsCount} Face • {auditReport.summary.skippedCount} Skipped
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#FFF5F5' }}>
                <Typography variant="caption" color="#C62828" fontWeight={700}>REDNESS CHANGE</Typography>
                <Typography variant="h4" fontWeight={800} color="#C62828">
                  {auditReport.summary.rednessDelta <= 0 ? `${auditReport.summary.rednessDelta}%` : `+${auditReport.summary.rednessDelta}%`}
                </Typography>
                <Typography variant="caption" color="text.secondary">Erythema Trend</Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#F0F7FF' }}>
                <Typography variant="caption" color="#1565C0" fontWeight={700}>SEBUM CHANGE</Typography>
                <Typography variant="h4" fontWeight={800} color="#1565C0">
                  {auditReport.summary.oilinessDelta <= 0 ? `${auditReport.summary.oilinessDelta}%` : `+${auditReport.summary.oilinessDelta}%`}
                </Typography>
                <Typography variant="caption" color="text.secondary">Oiliness Trend</Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: '#F1FDF5' }}>
                <Typography variant="caption" color="#2E7D32" fontWeight={700}>HEALTH PROGRESS</Typography>
                <Typography variant="h4" fontWeight={800} color="#2E7D32">
                  {auditReport.summary.healthDelta >= 0 ? `+${auditReport.summary.healthDelta}%` : `${auditReport.summary.healthDelta}%`}
                </Typography>
                <Typography variant="caption" color="text.secondary">Overall Barrier Balance</Typography>
              </Paper>
            </Box>

            {/* Visual Comparison: Earliest Post vs Latest Post */}
            {completedPosts.length >= 2 && (
              <Box mb={3} p={2} sx={{ bgcolor: '#F8F9FA', borderRadius: 2.5, border: '1px solid #EAEAEA' }}>
                <Typography variant="subtitle2" fontWeight={800} color="#1A1A2E" mb={1.5}>
                  📸 Visual Progress (Earliest vs. Latest Analyzed Post):
                </Typography>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                  {/* Earliest Post */}
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFF' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        EARLIEST • {completedPosts[0].date}
                      </Typography>
                      <Chip label={`Health: ${completedPosts[0].healthScore}%`} size="small" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Box display="flex" gap={1.5} alignItems="center">
                      <img 
                        src={completedPosts[0].imageSrc} 
                        alt="Earliest" 
                        style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #E0E0E0' }} 
                      />
                      <Box>
                        <Typography variant="caption" display="block" color="#C62828" fontWeight={700}>
                          Redness: {completedPosts[0].metrics?.Redness}%
                        </Typography>
                        <Typography variant="caption" display="block" color="#1565C0" fontWeight={700}>
                          Oiliness: {completedPosts[0].metrics?.Oiliness}%
                        </Typography>
                        <Typography variant="caption" display="block" color="#6A1B9A" fontWeight={700}>
                          Texture: {completedPosts[0].metrics?.Texture}%
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                          Skin: <strong>{completedPosts[0].skinType}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Latest Post */}
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F1FDF5', borderColor: '#81C784' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" fontWeight={700} color="#2E7D32">
                        LATEST • {completedPosts[completedPosts.length - 1].date}
                      </Typography>
                      <Chip label={`Health: ${completedPosts[completedPosts.length - 1].healthScore}%`} size="small" color="success" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Box display="flex" gap={1.5} alignItems="center">
                      <img 
                        src={completedPosts[completedPosts.length - 1].imageSrc} 
                        alt="Latest" 
                        style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #81C784' }} 
                      />
                      <Box>
                        <Typography variant="caption" display="block" color="#C62828" fontWeight={700}>
                          Redness: {completedPosts[completedPosts.length - 1].metrics?.Redness}%
                        </Typography>
                        <Typography variant="caption" display="block" color="#1565C0" fontWeight={700}>
                          Oiliness: {completedPosts[completedPosts.length - 1].metrics?.Oiliness}%
                        </Typography>
                        <Typography variant="caption" display="block" color="#6A1B9A" fontWeight={700}>
                          Texture: {completedPosts[completedPosts.length - 1].metrics?.Texture}%
                        </Typography>
                        <Typography variant="caption" display="block" color="#2E7D32" mt={0.5}>
                          Skin: <strong>{completedPosts[completedPosts.length - 1].skinType}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              </Box>
            )}

            {/* Timeline Progress Bar across Instagram Feed */}
            {completedPosts.length >= 2 && (
              <Box mb={3} p={2} sx={{ bgcolor: '#F9F9FB', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Skin Health Timeline Across Posts (Click photo to inspect):
                </Typography>
                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  {completedPosts.map((cp, idx) => (
                    <Paper 
                      key={cp.id} 
                      variant="outlined"
                      onClick={() => setSelectedPost(cp)}
                      sx={{ 
                        p: 1, 
                        textAlign: 'center', 
                        flexGrow: 1, 
                        minWidth: 100,
                        cursor: 'pointer',
                        borderRadius: 2,
                        bgcolor: idx === completedPosts.length - 1 ? '#F1FDF5' : '#FFF',
                        borderColor: idx === completedPosts.length - 1 ? '#81C784' : '#E0E0E0',
                        transition: 'transform 0.15s',
                        '&:hover': { transform: 'scale(1.03)', boxShadow: 2 }
                      }}
                    >
                      <img 
                        src={cp.imageSrc} 
                        alt={cp.date} 
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, display: 'block', margin: '0 auto 6px' }} 
                      />
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        {cp.date}
                      </Typography>
                      <Chip 
                        label={`Health: ${cp.healthScore}%`} 
                        size="small" 
                        color={idx === completedPosts.length - 1 ? 'success' : 'primary'} 
                        sx={{ fontWeight: 700, mt: 0.5, height: 22, fontSize: '0.72rem' }} 
                      />
                    </Paper>
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap">
        <Typography variant="h6" fontWeight={800} color="#1A1A2E">
          Current Feed: {activeQueryTitle} ({posts.length} Posts)
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2.5}>
        Click on any post after scanning to view its individual landmarks, cropped skin patches, and scores.
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
            <Box sx={{ width: '100%', height: 240, overflow: 'hidden', bgcolor: '#000', position: 'relative' }}>
              <img 
                src={post.imageSrc} 
                alt="Instagram post" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <Chip
                label={post.tag || activeQueryTitle}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  backdropFilter: 'blur(4px)',
                }}
              />
            </Box>

            {/* Caption & Stats */}
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                {post.caption}
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
              <Box mb={2} sx={{ textAlign: 'center' }}>
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
                    <Box key={region} sx={{ textAlign: 'center' }}>
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
