import express from 'express';
import KnowledgeBaseService from '../services/KnowledgeBaseService';

const router = express.Router();

/**
 * GET /api/knowledge
 * Get all learned answers
 */
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    const knowledge = await KnowledgeBaseService.getLearnedAnswers(
      limit ? parseInt(limit as string) : 50
    );
    res.json(knowledge);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

/**
 * POST /api/knowledge/search
 * Search knowledge base for an answer
 */
router.post('/search', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const answer = await KnowledgeBaseService.searchKnowledge(question);
    res.json({ found: !!answer, answer });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

/**
 * POST /api/knowledge
 * Manually add knowledge
 */
router.post('/', async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer are required' });
    }

    const knowledge = await KnowledgeBaseService.addKnowledge(
      question,
      answer,
      undefined,
      category
    );

    res.status(201).json(knowledge);
  } catch (error) {
    console.error('Error adding knowledge:', error);
    res.status(500).json({ error: 'Failed to add knowledge' });
  }
});

export default router;
