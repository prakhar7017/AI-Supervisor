import express from 'express';
import HelpRequestService from '../services/HelpRequestService';
import { RequestStatus } from '../models/HelpRequest';

const router = express.Router();

/**
 * GET /api/help-requests
 * Get all help requests with optional status filter
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const requests = await HelpRequestService.getAllRequests(
      status as RequestStatus,
      limit ? parseInt(limit as string) : 100
    );
    res.json(requests);
  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ error: 'Failed to fetch help requests' });
  }
});

/**
 * GET /api/help-requests/pending
 * Get all pending help requests
 */
router.get('/pending', async (req, res) => {
  try {
    const requests = await HelpRequestService.getPendingRequests();
    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

/**
 * GET /api/help-requests/stats
 * Get help request statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await HelpRequestService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/help-requests/:id
 * Get a specific help request by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const request = await HelpRequestService.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error fetching help request:', error);
    res.status(500).json({ error: 'Failed to fetch help request' });
  }
});

/**
 * POST /api/help-requests/:id/respond
 * Supervisor responds to a help request
 */
router.post('/:id/respond', async (req, res) => {
  try {
    const { supervisorResponse, supervisorName, resolved } = req.body;

    if (!supervisorResponse || !supervisorName) {
      return res.status(400).json({
        error: 'supervisorResponse and supervisorName are required'
      });
    }

    const updatedRequest = await HelpRequestService.respondToRequest(
      req.params.id,
      supervisorResponse,
      supervisorName,
      resolved !== false // Default to true
    );

    res.json(updatedRequest);
  } catch (error: any) {
    console.error('Error responding to help request:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to help request' });
  }
});

export default router;
