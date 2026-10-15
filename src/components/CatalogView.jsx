import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { FOREO_PRODUCTS } from '../services/foreoCatalog';

export default function CatalogView() {
  const products = Object.values(FOREO_PRODUCTS);

  return (
    <Box mt={2}>
      <Typography variant="h5" fontWeight={800} color="#1A1A2E" gutterBottom>
        FOREO Beauty-Tech Hardware Portfolio
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Engineered hardware devices and clinical treatment modes matched by the offline recommendation engine.
      </Typography>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
        {products.map((prod) => (
          <Paper 
            key={prod.id} 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              borderTop: `5px solid ${prod.color}`, 
              bgcolor: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="overline" fontWeight={700} sx={{ color: prod.color, letterSpacing: 1 }}>
                  {prod.category}
                </Typography>
                <Chip label={prod.protocol.frequency} size="small" variant="outlined" />
              </Box>

              <Typography variant="h5" fontWeight={800} color="#1A1A2E" gutterBottom>
                {prod.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontStyle="italic" mb={2}>
                {prod.tagline}
              </Typography>

              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                TECHNOLOGY & FEATURES:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, mb: 2 }}>
                {prod.features.map((feat, idx) => (
                  <Typography component="li" variant="body2" key={idx} sx={{ color: '#444', mb: 0.5 }}>
                    {feat}
                  </Typography>
                ))}
              </Box>
            </Box>

            <Box sx={{ bgcolor: '#F8F9FA', p: 1.5, borderRadius: 2, border: '1px solid #EAEAEA' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>PROTOCOL:</strong> {prod.protocol.mode} ({prod.protocol.duration})
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                <strong>PAIRING:</strong> {prod.topicalPairing}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
