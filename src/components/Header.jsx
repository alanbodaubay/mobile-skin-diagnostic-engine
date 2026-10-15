import React from 'react';
import { AppBar, Toolbar, Typography, Box, Chip, Tabs, Tab } from '@mui/material';

export default function Header({ currentTab, onTabChange }) {
  return (
    <AppBar position="sticky" sx={{ bgcolor: '#1A1A2E', color: '#FFF', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <Toolbar sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, py: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5} flexGrow={1}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#FF1493',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            F
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.2 }}>
              FOREO Skin Diagnostics
            </Typography>
            <Typography variant="caption" sx={{ color: '#A0A0B0', fontSize: '0.72rem' }}>
              Offline Edge-AI Engine • 100% On-Device
            </Typography>
          </Box>
          <Chip 
            label="100% Private" 
            size="small" 
            sx={{ 
              ml: 1, 
              bgcolor: 'rgba(0, 230, 118, 0.15)', 
              color: '#00E676', 
              fontWeight: 600,
              fontSize: '0.7rem',
              border: '1px solid rgba(0, 230, 118, 0.3)'
            }} 
          />
        </Box>

        <Tabs 
          value={currentTab} 
          onChange={(e, val) => onTabChange(val)}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{
            '& .MuiTabs-indicator': { bgcolor: '#FF1493', height: 3 },
            mt: { xs: 1, sm: 0 },
            minHeight: 44,
          }}
        >
          <Tab label="Scan & Diagnose" value="scan" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Progress & History" value="history" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="FOREO Catalog" value="catalog" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
