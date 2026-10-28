import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Card, CardContent, Chip, LinearProgress 
} from '@mui/material';
import { getAllScans, deleteScanRecord, clearAllScans, getScanTrends } from '../services/historyStorage';

export default function HistoryDashboard({ onStartNewScan }) {
  const [scans, setScans] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAllScans(), getScanTrends()])
      .then(([all, trendData]) => {
        if (!ignore) {
          setScans(all);
          setTrends(trendData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load history:', err);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const refreshHistory = async () => {
    try {
      const all = await getAllScans();
      const trendData = await getScanTrends();
      setScans(all);
      setTrends(trendData);
    } catch (err) {
      console.error('Failed to reload history:', err);
    }
  };

  const handleDelete = async (id) => {
    await deleteScanRecord(id);
    await refreshHistory();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all skin scan history?')) {
      await clearAllScans();
      await refreshHistory();
    }
  };

  if (loading) {
    return (
      <Box p={4} sx={{ textAlign: 'center' }}>
        <LinearProgress color="secondary" />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading on-device scan history...
        </Typography>
      </Box>
    );
  }

  if (scans.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3, my: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom color="primary">
          No Scan History Yet
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3} maxWidth={400} mx="auto">
          Perform your first skin diagnostic scan to start tracking visual trends, erythema reduction, and sebum balance over time!
        </Typography>
        <Button variant="contained" color="secondary" onClick={onStartNewScan} size="large">
          Start First Diagnostic Scan
        </Button>
      </Paper>
    );
  }

  // Calculate longitudinal delta if multiple scans exist
  const firstScan = scans[scans.length - 1];
  const latestScan = scans[0];
  const healthDelta = (latestScan.metrics?.HealthScore ?? 0) - (firstScan.metrics?.HealthScore ?? 0);

  return (
    <Box mt={2}>
      {/* Header bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#1A1A2E">
            Skin Progress & History (Week 7)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Stored locally on your device via IndexedDB • 100% Private
          </Typography>
        </Box>
        <Button variant="outlined" color="error" size="small" onClick={handleClearAll}>
          Clear All History
        </Button>
      </Box>

      {/* Progress Summary Cards */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={2} mb={3}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FFF' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL SCANS</Typography>
          <Typography variant="h4" fontWeight={800} color="primary">{scans.length}</Typography>
          <Typography variant="caption" color="text.secondary">Tracked Over Time</Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FFF' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>SKIN HEALTH SCORE</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color: latestScan.metrics?.HealthScore > 65 ? '#2E7D32' : '#E65100' }}>
            {latestScan.metrics?.HealthScore}%
          </Typography>
          {scans.length > 1 && (
            <Typography variant="caption" sx={{ color: healthDelta >= 0 ? '#2E7D32' : '#C62828', fontWeight: 700 }}>
              {healthDelta >= 0 ? `+${healthDelta}% Improvement` : `${healthDelta}% Change`}
            </Typography>
          )}
        </Paper>

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FFF' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>CURRENT ROUTINE</Typography>
          <Typography variant="subtitle1" fontWeight={800} color="secondary" noWrap sx={{ mt: 1 }}>
            {latestScan.primaryDevice}
          </Typography>
          <Typography variant="caption" color="text.secondary">{latestScan.skinType}</Typography>
        </Paper>
      </Box>

      {/* Longitudinal Visual Trends */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: '#FAFAFC' }}>
        <Typography variant="h6" fontWeight={700} color="#1A1A2E" gutterBottom>
          Skin Metrics Longitudinal Progress
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Timeline of objective visual metrics across consecutive scans.
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          {trends.map((t) => (
            <Box key={t.timestamp} sx={{ bgcolor: '#FFF', p: 2, borderRadius: 2, border: '1px solid #EAEAEA' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Scan #{t.scanNumber} • <span style={{ color: '#666', fontWeight: 400 }}>{t.date}</span>
                </Typography>
                <Chip label={`Health: ${t.healthScore}%`} size="small" color="primary" sx={{ fontWeight: 700 }} />
              </Box>

              <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} mt={1}>
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Redness</Typography>
                    <Typography variant="caption" fontWeight={700}>{t.redness}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={t.redness} sx={{ height: 6, borderRadius: 3, bgcolor: '#FFEBEE', '& .MuiLinearProgress-bar': { bgcolor: '#E53935' } }} />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Oiliness</Typography>
                    <Typography variant="caption" fontWeight={700}>{t.oiliness}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={t.oiliness} sx={{ height: 6, borderRadius: 3, bgcolor: '#E3F2FD', '& .MuiLinearProgress-bar': { bgcolor: '#1E88E5' } }} />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Texture</Typography>
                    <Typography variant="caption" fontWeight={700}>{t.texture}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={t.texture} sx={{ height: 6, borderRadius: 3, bgcolor: '#F3E5F5', '& .MuiLinearProgress-bar': { bgcolor: '#8E24AA' } }} />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Before & After Visual Comparison (if >= 2 scans) */}
      {scans.length >= 2 && firstScan.rois && latestScan.rois && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: '#FFF' }}>
          <Typography variant="h6" fontWeight={700} color="#1A1A2E" gutterBottom>
            Before & After Skin Comparison
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Side-by-side view comparing baseline ({firstScan.dateString}) to latest scan ({latestScan.dateString}).
          </Typography>

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            {/* Baseline */}
            <Box sx={{ border: '2px solid #E0E0E0', borderRadius: 2, p: 2, bgcolor: '#F9F9F9' }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5} align="center">
                BASELINE (Scan #1)
              </Typography>
              <Box display="flex" justifyContent="space-around" flexWrap="wrap" gap={1}>
                {Object.entries(firstScan.rois).map(([region, src]) => (
                  <Box key={region} sx={{ textAlign: 'center' }}>
                    <img src={src} alt={region} style={{ width: 60, height: 60, borderRadius: 6, border: '1px solid #CCC' }} />
                    <Typography variant="caption" display="block">{region}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" display="block" align="center" mt={1.5} fontWeight={600}>
                Redness: {firstScan.metrics?.Redness}% • Oil: {firstScan.metrics?.Oiliness}%
              </Typography>
            </Box>

            {/* Latest */}
            <Box sx={{ border: '2px solid #00E676', borderRadius: 2, p: 2, bgcolor: '#F1FDF5' }}>
              <Typography variant="subtitle2" fontWeight={700} color="#2E7D32" mb={1.5} align="center">
                LATEST (Scan #{scans.length})
              </Typography>
              <Box display="flex" justifyContent="space-around" flexWrap="wrap" gap={1}>
                {Object.entries(latestScan.rois).map(([region, src]) => (
                  <Box key={region} sx={{ textAlign: 'center' }}>
                    <img src={src} alt={region} style={{ width: 60, height: 60, borderRadius: 6, border: '1px solid #81C784' }} />
                    <Typography variant="caption" display="block">{region}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" display="block" align="center" mt={1.5} fontWeight={600} color="#2E7D32">
                Redness: {latestScan.metrics?.Redness}% • Oil: {latestScan.metrics?.Oiliness}%
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Scan History Detailed Log */}
      <Typography variant="h6" fontWeight={700} mb={2} color="#1A1A2E">
        Detailed Scan Records
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        {scans.map((scan) => (
          <Card key={scan.id} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {scan.dateString}
                  </Typography>
                  <Typography variant="body2" color="secondary" fontWeight={600}>
                    {scan.primaryDevice} • <span style={{ color: '#555', fontWeight: 400 }}>{scan.skinType}</span>
                  </Typography>
                </Box>
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => handleDelete(scan.id)}
                  sx={{ textTransform: 'none' }}
                >
                  Delete
                </Button>
              </Box>

              <Box display="flex" gap={2} mt={1.5} flexWrap="wrap">
                <Chip label={`Redness: ${scan.metrics?.Redness}%`} size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828' }} />
                <Chip label={`Oiliness: ${scan.metrics?.Oiliness}%`} size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }} />
                <Chip label={`Texture: ${scan.metrics?.Texture}%`} size="small" sx={{ bgcolor: '#F3E5F5', color: '#6A1B9A' }} />
                <Chip label={`Health Score: ${scan.metrics?.HealthScore}%`} size="small" color="primary" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
