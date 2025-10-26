import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import VoiceAgent from '../agents/VoiceAgent';

const router = express.Router();

/**
 * POST /api/livekit/token
 * Generate LiveKit access token for a participant
 */
router.post('/token', async (req, res) => {
  try {
    const { roomName, participantName, customerPhone } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({
        error: 'roomName and participantName are required'
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: 'LiveKit credentials not configured'
      });
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true
    });

    const token = await at.toJwt();

    // Initialize voice agent context
    VoiceAgent.initializeContext(roomName, customerPhone || 'unknown', participantName);

    res.json({
      token,
      url: process.env.LIVEKIT_URL
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

/**
 * POST /api/livekit/process-speech
 * Process user speech through the voice agent
 */
router.post('/process-speech', async (req, res) => {
  try {
    const { roomName, speech } = req.body;

    if (!roomName || !speech) {
      return res.status(400).json({
        error: 'roomName and speech are required'
      });
    }

    const result = await VoiceAgent.processUserSpeech(roomName, speech);
    res.json(result);
  } catch (error: any) {
    console.error('Error processing speech:', error);
    res.status(500).json({ error: error.message || 'Failed to process speech' });
  }
});

/**
 * POST /api/livekit/end-call
 * Clean up when call ends
 */
router.post('/end-call', async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required' });
    }

    VoiceAgent.clearContext(roomName);
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

export default router;
