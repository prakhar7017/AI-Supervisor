# System Architecture

## Overview

FrontDesk is an AI-powered receptionist system that handles voice calls, escalates unknown questions to human supervisors, and learns from their responses to build a knowledge base.

## Core Components

### 1. Voice Agent (`server/agents/VoiceAgent.ts`)

**Responsibilities:**
- Manages conversation context for each call
- Searches knowledge base for answers
- Determines when to escalate to humans
- Generates AI responses using GPT-4

**Key Methods:**
- `processUserSpeech()`: Main entry point for handling user questions
- `shouldEscalateToHuman()`: Uses GPT-4 to intelligently decide escalation
- `generateAIResponse()`: Fallback AI response generation

**Decision Flow:**
```
User Question
    ↓
Search Knowledge Base
    ↓
Found? → Yes → Return Answer
    ↓
   No
    ↓
Should Escalate?
    ↓
Yes → Create Help Request → Notify Supervisor
    ↓
No → Generate AI Response
```

### 2. Knowledge Base Service (`server/services/KnowledgeBaseService.ts`)

**Responsibilities:**
- Semantic search using MongoDB text indexes
- Best match selection using GPT-4
- Keyword extraction and matching
- Usage tracking and statistics

**Search Strategy:**
1. **Text Search**: MongoDB full-text search with scoring
2. **GPT-4 Matching**: AI determines best match from candidates
3. **Keyword Fallback**: Matches based on extracted keywords
4. **Usage Tracking**: Updates `usageCount` and `lastUsed`

**Learning Process:**
```
Supervisor Response
    ↓
Extract Keywords
    ↓
Create Knowledge Entry
    ↓
Link to Source Request
    ↓
Available for Future Queries
```

### 3. Help Request Service (`server/services/HelpRequestService.ts`)

**Responsibilities:**
- Create and manage help requests
- Handle supervisor responses
- Update knowledge base from resolutions
- Track request lifecycle

**Request Lifecycle:**
```
PENDING → Appears in Dashboard → Supervisor Responds → RESOLVED/UNRESOLVED
    ↓                                                            ↓
Logged to Database                                    Update Knowledge Base
```

### 4. Dashboard Notification System

**Responsibilities:**
- Display new help requests in supervisor dashboard
- Auto-refresh dashboard every 10 seconds
- No external notification services required
- All data stays in MongoDB

**Notification Flow:**
```
Help Request Created
    ↓
Saved to MongoDB
    ↓
Dashboard Polls for Updates
    ↓
Request Appears in UI
```

## Data Models

### HelpRequest
```typescript
{
  customerPhone: string
  customerName?: string
  question: string
  context?: string  // Conversation history
  status: PENDING | RESOLVED | UNRESOLVED
  supervisorResponse?: string
  supervisorName?: string
  respondedAt?: Date
  roomName?: string  // LiveKit room
  createdAt: Date
  updatedAt: Date
}
```

### KnowledgeBase
```typescript
{
  question: string
  answer: string
  category?: string
  keywords: string[]
  sourceRequestId?: ObjectId  // Links to HelpRequest
  learnedFrom: SUPERVISOR | MANUAL | INITIAL
  usageCount: number
  lastUsed?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### NotificationLog (Optional)
```typescript
{
  message: string
  type: SUPERVISOR_NOTIFICATION | CUSTOMER_FOLLOWUP
  relatedRequestId?: ObjectId
  createdAt: Date
}
```

**Note**: This model is optional and only used for internal logging. No external notifications are sent.

## API Endpoints

### Help Requests
- `GET /api/help-requests` - List all requests
- `GET /api/help-requests/pending` - List pending requests
- `GET /api/help-requests/stats` - Get statistics
- `GET /api/help-requests/:id` - Get specific request
- `POST /api/help-requests/:id/respond` - Supervisor responds

### Knowledge Base
- `GET /api/knowledge` - List learned answers
- `POST /api/knowledge/search` - Search for answer
- `POST /api/knowledge` - Manually add knowledge

### LiveKit
- `POST /api/livekit/token` - Generate access token
- `POST /api/livekit/process-speech` - Process user speech
- `POST /api/livekit/end-call` - Clean up call context

## Frontend Architecture

### Pages

**Dashboard** (`client/src/pages/Dashboard.tsx`)
- Auto-refreshing pending requests (10s polling)
- Statistics overview
- Quick access to request details
- No external notification dependencies

**HelpRequestDetails** (`client/src/pages/HelpRequestDetails.tsx`)
- Full request information
- Response form for supervisors
- Resolved/Unresolved marking

**LearnedAnswers** (`client/src/pages/LearnedAnswers.tsx`)
- Knowledge base viewer
- Usage statistics
- Source tracking

**VoiceTest** (`client/src/pages/VoiceTest.tsx`)
- LiveKit integration
- Real-time voice calls
- Call log display

### State Management

Uses React hooks for local state:
- `useState` for component state
- `useEffect` for data fetching
- `useRef` for LiveKit room management

### API Client (`client/src/services/api.ts`)

Axios-based client with typed responses:
- Automatic JSON parsing
- Error handling
- Type-safe requests

## LiveKit Integration

### Connection Flow
```
1. User clicks "Start Call"
    ↓
2. Frontend requests token from backend
    ↓
3. Backend generates JWT with LiveKit SDK
    ↓
4. Frontend connects to LiveKit room
    ↓
5. Enable microphone
    ↓
6. Audio streams to LiveKit
    ↓
7. (Future) LiveKit processes audio → STT → Backend
    ↓
8. Backend processes question
    ↓
9. (Future) Response → TTS → Audio stream
```

### Current Implementation

The current implementation provides the foundation for voice calls:
- Room creation and management
- Token generation
- Microphone access
- Audio streaming

**Note**: Full speech-to-text and text-to-speech integration would require additional LiveKit Agents or third-party STT/TTS services.

## Scalability Considerations

### Database Indexes
- Text index on `KnowledgeBase` for fast search
- Compound index on `HelpRequest.status` and `createdAt`
- Index on `customerPhone` for customer history

### Caching Opportunities
- Knowledge base results (Redis)
- Frequently asked questions
- GPT-4 responses for common queries

### Horizontal Scaling
- Stateless backend (can run multiple instances)
- MongoDB Atlas auto-scaling
- LiveKit cloud handles voice infrastructure

### Performance Optimizations
- Limit knowledge base search results
- Efficient dashboard polling (10s intervals)
- Async processing for non-critical tasks
- Consider WebSocket for real-time updates

## Security Considerations

### Current Implementation
- Environment variables for secrets
- CORS configuration
- Input validation on API endpoints

### Production Recommendations
- Add authentication (JWT, OAuth)
- Rate limiting on API endpoints
- Encrypt sensitive data in database
- HTTPS only
- Sanitize user inputs
- Implement RBAC for supervisor dashboard

## Monitoring & Logging

### Current Logging
- Console logs for key events
- Request lifecycle tracking
- Dashboard access logs

### Production Recommendations
- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- LiveKit analytics dashboard
- MongoDB Atlas monitoring

## Future Enhancements

1. **Voice Processing**
   - Integrate STT (Speech-to-Text) service
   - Integrate TTS (Text-to-Speech) service
   - Real-time transcription display

2. **Advanced AI**
   - Multi-turn conversations
   - Context-aware responses
   - Sentiment analysis
   - Language detection

3. **Analytics**
   - Call duration tracking
   - Resolution time metrics
   - Customer satisfaction scores
   - Knowledge base effectiveness

4. **Integrations**
   - CRM systems (Salesforce, HubSpot)
   - Calendar for appointments
   - Ticketing systems (Zendesk, Jira)
   - Optional: Email/Slack notifications for supervisors
   - WebSocket for real-time dashboard updates

5. **Multi-tenancy**
   - Support multiple organizations
   - Isolated knowledge bases
   - Custom branding
   - Usage-based billing
