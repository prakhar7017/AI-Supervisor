# 🏢 FrontDesk AI Receptionist

An **AI-powered receptionist system** with **LiveKit voice integration** that escalates to human supervisors when needed.

---

## ✨ Features

- 🎙️ **LiveKit Voice Agent** – Real-time voice conversations with AI receptionist  
- 🆘 **Smart Escalation** – Automatically escalates unknown questions to human supervisors  
- 📋 **Dashboard Notifications** – New requests appear directly in supervisor dashboard  
- 🧠 **Knowledge Base** – Self-learning system that updates from supervisor responses  
- 📊 **Supervisor Dashboard** – Clean UI for managing help requests and viewing history  
- 🔄 **Request Lifecycle** – Track requests from `Pending → Resolved/Unresolved`

---

## 🧰 Tech Stack

- **Backend:** Node.js, Express, MongoDB  
- **Frontend:** React, TypeScript, Vite, TailwindCSS  
- **Voice:** LiveKit, OpenAI  
- **Notifications:** Direct dashboard notifications (no third-party dependencies)

---

## ⚙️ Setup

### 1. Install dependencies
```bash
npm run install-all
```

### 2. Configure environment
- Copy `.env.example` → `.env`  
- Fill in your **MongoDB**, **LiveKit**, **OpenAI**, and **Twilio** credentials.

### 3. Run the application
```bash
npm run dev
```

### 4. Access the application
- **Frontend:** http://localhost:5173  
- **Backend:** http://localhost:3001

---

## 🏗️ Architecture

### 🗄️ Database Models
- **HelpRequest** – Tracks customer questions, supervisor responses, and lifecycle status  
- **KnowledgeBase** – Stores learned Q&A pairs for future reference

### 🔁 Key Flows
1. **Customer Call → AI Response** – AI answers if knowledge exists  
2. **Unknown Question → Escalation** – Creates help request, appears in dashboard  
3. **Supervisor Response → Knowledge Update** – Updates knowledge base automatically  
4. **Future Calls** – AI uses learned answers from knowledge base

---

## 🧪 LiveKit Voice Demo

To test the voice agent:

1. Start the server with:
   ```bash
   npm run dev
   ```
2. Navigate to the **"Voice Test"** page  
3. Click **"Start Call"** to connect to the LiveKit room  
4. Speak your question to the AI receptionist  
5. Try asking something it doesn’t know to trigger escalation

---

## 🗂️ Project Structure

```bash
FrontDesk/
├── server/
│   ├── index.js              # Express server
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   └── agents/               # LiveKit voice agent
├── client/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API clients
│   │   └── types/            # TypeScript types
│   └── package.json
└── package.json
```

---

## 📜 License

MIT
