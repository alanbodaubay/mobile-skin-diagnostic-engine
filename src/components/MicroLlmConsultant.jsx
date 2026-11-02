import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  TextField,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  detectOnDeviceLlmSupport,
  queryOnDeviceConsultant,
} from '../services/microLlmService';

export default function MicroLlmConsultant({
  aiResults,
  recommendation,
}) {
  const [engineInfo, setEngineInfo] = useState({
    type: 'On-Device Skincare AI Engine',
    available: true,
  });
  const [customMessages, setCustomMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  // Detect local LLM capabilities on mount
  useEffect(() => {
    async function checkLlm() {
      const info = await detectOnDeviceLlmSupport();
      setEngineInfo(info);
    }
    checkLlm();
  }, []);

  const devName = recommendation?.primaryDevice?.name || 'FOREO Device';
  const initialWelcome = {
    sender: 'ai',
    text: `Hello! I've reviewed your skin check-in. 

Based on your scan, we tailored a routine centered around the ${devName} to soothe redness, balance sebum, and keep your skin barrier healthy.

Ask me anything—like what to do if you don't have this device, whether you can pair it with Retinol, or how to wash with your hands instead!`,
  };

  const displayMessages = customMessages.length > 0 ? customMessages : [initialWelcome];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [customMessages, isGenerating]);

  const handleSendMessage = async (textToSend) => {
    const q = textToSend || inputValue;
    if (!q.trim() || !aiResults || !recommendation) return;

    const userMsg = { sender: 'user', text: q.trim() };
    setCustomMessages((prev) => (prev.length === 0 ? [initialWelcome, userMsg] : [...prev, userMsg]));
    setInputValue('');
    setIsGenerating(true);

    try {
      const response = await queryOnDeviceConsultant({
        question: q,
        metrics: aiResults.metrics,
        skinType: aiResults.skinType,
        detectedConcerns: aiResults.detectedConcerns,
        recommendation,
      });

      setCustomMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.answer,
        },
      ]);
    } catch (err) {
      console.error('Micro-LLM consultation error:', err);
      setCustomMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `I encountered a momentary issue. Please feel free to ask again!`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    "What if I don't use this device?",
    'Can I just wash with my hands?',
    'Can I combine Retinol or Vitamin C?',
    'Does it hurt or irritate sensitive skin?',
    'How long until I see results?',
  ];

  if (!recommendation || !aiResults) return null;

  return (
    <Paper
      elevation={2}
      sx={{
        mt: 3.5,
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        border: '1px solid #E1BEE7',
        boxShadow: '0 4px 20px rgba(156, 39, 176, 0.06)',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} mb={1.5}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: '#9C27B0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            💬
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#1A1A2E" lineHeight={1.2}>
              FOREO Beauty Consultant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Personalized skincare guidance • {engineInfo.type}
            </Typography>
          </Box>
        </Box>

        <Chip
          label="🔒 100% Private (On-Device)"
          size="small"
          sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: '0.72rem' }}
        />
      </Box>

      {/* Suggested Quick Prompt Chips */}
      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        {quickPrompts.map((prompt, i) => (
          <Chip
            key={i}
            label={prompt}
            size="small"
            clickable
            disabled={isGenerating}
            onClick={() => handleSendMessage(prompt)}
            sx={{
              bgcolor: '#F3E5F5',
              color: '#4A148C',
              fontSize: '0.75rem',
              fontWeight: 600,
              '&:hover': { bgcolor: '#E1BEE7' },
              height: 'auto',
              py: 0.5,
            }}
          />
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Chat Messages Log */}
      <Box
        sx={{
          maxHeight: 380,
          overflowY: 'auto',
          pr: 1,
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {displayMessages.map((m, idx) => (
          <Box
            key={idx}
            sx={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: { xs: '95%', sm: '85%' },
              p: 1.8,
              borderRadius: 2.5,
              bgcolor: m.sender === 'user' ? '#1A1A2E' : '#F9F9FC',
              color: m.sender === 'user' ? '#FFF' : '#222',
              border: m.sender === 'user' ? 'none' : '1px solid #EAEAEA',
              boxShadow: m.sender === 'user' ? '0 2px 8px rgba(26,26,46,0.1)' : 'none',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontSize: '0.88rem',
              }}
            >
              {m.text}
            </Typography>
          </Box>
        ))}

        {isGenerating && (
          <Box display="flex" alignItems="center" gap={1} p={1.5} sx={{ bgcolor: '#F5F5FA', borderRadius: 2, maxWidth: 200 }}>
            <CircularProgress size={16} color="secondary" />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Thinking...
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Box */}
      <Box display="flex" gap={1}>
        <TextField
          placeholder="Ask anything about your routine or products..."
          size="small"
          fullWidth
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          disabled={isGenerating}
          sx={{
            bgcolor: '#FAFAFC',
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />
        <Button
          variant="contained"
          color="secondary"
          disabled={!inputValue.trim() || isGenerating}
          onClick={() => handleSendMessage()}
          sx={{ px: 3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
}
