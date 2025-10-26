# FrontDesk AI Receptionist - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- LiveKit Cloud account
- OpenAI API key
- (Optional) Twilio account for real SMS

## Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

### MongoDB
Get your connection string from MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Create a cluster (free tier available)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/frontdesk?retryWrites=true&w=majority
```

### LiveKit
Get credentials from LiveKit Cloud:
1. Go to https://cloud.livekit.io
2. Create a project
3. Go to Settings → Keys
4. Create an API key

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=your_secret_key
```

### OpenAI
Get your API key:
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

## Step 3: Run the Application

### Development Mode (Recommended)

```bash
# From root directory - runs both backend and frontend
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:5173

### Production Mode

```bash
# Build everything
npm run build

# Start production server
npm run server:start

# In another terminal, serve the built frontend
cd client
npm run preview
```

## Step 4: Test the Voice Agent

1. Open http://localhost:5173 in your browser
2. Navigate to "Voice Test" page
3. Fill in your name and phone number
4. Click "Start Call"
5. Allow microphone access when prompted
6. Speak to the AI receptionist

### Test Questions

Try these questions to test different flows:

**Questions the AI knows:**
- "What are your business hours?"
- "Where are you located?"
- "How can I contact support?"

**Questions that trigger escalation:**
- "What are your pricing plans?"
- "I need help with my account"
- "Can you give me a custom quote?"

## Step 5: Supervisor Dashboard

1. Navigate to "Dashboard" page
2. You'll see any pending help requests appear automatically
3. Click on a request to view details
4. Provide an answer and submit
5. The answer is immediately added to the knowledge base
6. Future customers asking the same question will get instant AI responses

## Step 6: View Learned Answers

1. Navigate to "Learned Answers" page
2. See all questions and answers the AI has learned
3. Answers learned from supervisors are highlighted

## Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check that your connection string is correct
- Verify database user has proper permissions

### LiveKit Connection Issues
- Verify your LiveKit URL and credentials
- Check that your LiveKit project is active
- Ensure you're using wss:// protocol

### Microphone Not Working
- Check browser permissions
- Try using HTTPS (LiveKit requires secure context)
- Test in Chrome/Edge (best compatibility)

### OpenAI API Errors
- Verify your API key is valid
- Check you have credits in your OpenAI account
- Ensure you're using GPT-4 access

### Dashboard Not Updating
- Dashboard auto-refreshes every 10 seconds
- Manually refresh the page to see new requests immediately
- Check browser console for any errors

## Architecture Overview

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│  Express API    │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐
│MongoDB│ │LiveKit│ │ OpenAI │
└───────┘ └──────┘  └─────────┘
```

## Key Features Implemented

✅ LiveKit voice integration with real-time audio
✅ AI-powered question answering using OpenAI GPT-4
✅ Intelligent escalation to human supervisors
✅ Direct dashboard notifications (no third-party services)
✅ Self-learning knowledge base
✅ Request lifecycle management (Pending/Resolved/Unresolved)
✅ Clean supervisor dashboard with auto-refresh
✅ Learned answers view with usage statistics

## Next Steps

1. **Customize Initial Knowledge**: Edit `server/services/KnowledgeBaseService.ts` to add your company's FAQ
2. **Deploy to Production**: Use services like Heroku, Railway, or Vercel
3. **Add Authentication**: Implement auth for supervisor dashboard
4. **Scale LiveKit**: Upgrade LiveKit plan for more concurrent calls
5. **Add Real-time Updates**: Implement WebSockets for instant dashboard updates

## Support

For issues or questions:
- Check the logs in terminal
- Review MongoDB Atlas metrics
- Check LiveKit dashboard for connection issues
- Verify all environment variables are set correctly
