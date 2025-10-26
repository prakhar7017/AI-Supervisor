// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helpRequestsRouter from './routes/helpRequests';
import knowledgeRouter from './routes/knowledge';
import livekitRouter from './routes/livekit';
import KnowledgeBaseService from './services/KnowledgeBaseService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/help-requests', helpRequestsRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/livekit', livekitRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    // Seed initial knowledge base
    await KnowledgeBaseService.seedInitialKnowledge();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 FrontDesk AI Receptionist Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔗 API endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/api/health`);
    console.log(`   - Help Requests: http://localhost:${PORT}/api/help-requests`);
    console.log(`   - Knowledge Base: http://localhost:${PORT}/api/knowledge`);
    console.log(`   - LiveKit: http://localhost:${PORT}/api/livekit`);
    console.log(`\n📞 Ready to receive calls!\n`);
  });
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
