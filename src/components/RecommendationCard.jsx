import React, { useState } from 'react';
import { 
  Paper, Typography, Box, Chip, Divider, Tabs, Tab, List, ListItem, ListItemText, Card, CardContent 
} from '@mui/material';

export default function RecommendationCard({ recommendation }) {
  const [activeRoutineTab, setActiveRoutineTab] = useState(0);

  if (!recommendation) return null;

  const { primaryDevice, secondaryDevice, priorityRationale, activeIngredients, ingredientsToAvoid, routines, skinType } = recommendation;

  return (
    <Box mt={4} width="100%">
      {/* Primary Recommended Device Card */}
      <Paper 
        elevation={4} 
        sx={{ 
          p: 3, 
          borderRadius: 3, 
          border: `2px solid ${primaryDevice.color}`, 
          bgcolor: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            bgcolor: primaryDevice.color, 
            color: '#FFF', 
            px: 2, 
            py: 0.5, 
            borderBottomLeftRadius: 10,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          PRIMARY PRESCRIPTION
        </Box>

        <Typography variant="overline" sx={{ color: primaryDevice.color, fontWeight: 700, letterSpacing: 1.5 }}>
          {primaryDevice.category.toUpperCase()}
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A1A2E', mb: 0.5 }}>
          {primaryDevice.name}
        </Typography>

        <Typography variant="subtitle1" sx={{ color: '#555', fontStyle: 'italic', mb: 2 }}>
          {primaryDevice.tagline}
        </Typography>

        <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 2, borderRadius: 2, mb: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.6 }}>
            <strong>Clinical Rationale:</strong> {priorityRationale}
          </Typography>
        </Box>

        {/* Device Protocol Details */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1A1A2E' }}>
          Recommended Device Protocol:
        </Typography>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.5} mb={2.5}>
          <Card variant="outlined" sx={{ bgcolor: '#F8F9FA' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">TREATMENT MODE</Typography>
              <Typography variant="body2" fontWeight={600}>{primaryDevice.protocol.mode}</Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ bgcolor: '#F8F9FA' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">DURATION & FREQUENCY</Typography>
              <Typography variant="body2" fontWeight={600}>{primaryDevice.protocol.duration} • {primaryDevice.protocol.frequency}</Typography>
            </CardContent>
          </Card>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          KEY HARDWARE FEATURES:
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, m: 0, mb: 2.5 }}>
          {primaryDevice.features.map((feat, idx) => (
            <Typography component="li" variant="body2" key={idx} sx={{ color: '#444', mb: 0.5 }}>
              {feat}
            </Typography>
          ))}
        </Box>

        {/* Secondary Complimentary Device */}
        {secondaryDevice && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #DDD' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              COMPLIMENTARY REGIMEN PARTNER:
            </Typography>
            <Box display="flex" alignItems="center" gap={1.5} mt={1}>
              <Chip 
                label={secondaryDevice.name} 
                size="small" 
                sx={{ bgcolor: secondaryDevice.color, color: '#FFF', fontWeight: 700 }} 
              />
              <Typography variant="body2" color="text.secondary">
                {secondaryDevice.tagline}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* AM / PM Daily Beauty-Tech Routines */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: '#FAFAFC' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1A1A2E' }}>
          Personalized Daily Beauty-Tech Routine
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Tailored to your {skinType} profile and measured skin metrics.
        </Typography>

        <Tabs 
          value={activeRoutineTab} 
          onChange={(e, val) => setActiveRoutineTab(val)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="☀️ Morning Routine" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="🌙 Evening Recovery" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        {activeRoutineTab === 0 && (
          <List dense disablePadding>
            {routines.morning.map((step) => (
              <ListItem key={step.step} sx={{ py: 1, px: 0 }}>
                <Box 
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: '#FF1493', 
                    color: '#FFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    mr: 2,
                    flexShrink: 0
                  }}
                >
                  {step.step}
                </Box>
                <ListItemText 
                  primary={<Typography variant="subtitle2" fontWeight={700}>{step.title}</Typography>}
                  secondary={<Typography variant="body2" color="text.secondary">{step.action}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        )}

        {activeRoutineTab === 1 && (
          <List dense disablePadding>
            {routines.evening.map((step) => (
              <ListItem key={step.step} sx={{ py: 1, px: 0 }}>
                <Box 
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: '#6A1B9A', 
                    color: '#FFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    mr: 2,
                    flexShrink: 0
                  }}
                >
                  {step.step}
                </Box>
                <ListItemText 
                  primary={<Typography variant="subtitle2" fontWeight={700}>{step.title}</Typography>}
                  secondary={<Typography variant="body2" color="text.secondary">{step.action}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Skincare Ingredients Guide */}
      <Paper elevation={1} sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: '#FFFFFF' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A1A2E' }}>
          Dermatological Ingredients Guide
        </Typography>

        <Box mb={2}>
          <Typography variant="caption" color="success.main" fontWeight={700} display="block" mb={1}>
            ✓ RECOMMENDED TOPICAL ACTIVES TO PAIR:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {activeIngredients.map((item, idx) => (
              <Chip key={idx} label={item} size="small" sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#2E7D32', fontWeight: 600 }} />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="caption" color="error.main" fontWeight={700} display="block" mb={1}>
            ✗ INGREDIENTS TO AVOID FOR THIS SKIN PROFILE:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {ingredientsToAvoid.map((item, idx) => (
              <Chip key={idx} label={item} size="small" sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#C62828', fontWeight: 600 }} />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
