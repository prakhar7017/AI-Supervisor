import OpenAI from 'openai';
import KnowledgeBaseService from '../services/KnowledgeBaseService';
import HelpRequestService from '../services/HelpRequestService';

let openai: OpenAI;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

export interface ConversationContext {
  customerPhone: string;
  customerName?: string;
  roomName: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class VoiceAgent {
  private contexts: Map<string, ConversationContext> = new Map();

  initializeContext(roomName: string, customerPhone: string, customerName?: string): void {
    this.contexts.set(roomName, {
      customerPhone,
      customerName,
      roomName,
      conversationHistory: []
    });
  }

  async processUserSpeech(
    roomName: string,
    userSpeech: string
  ): Promise<{ response: string; needsEscalation: boolean; helpRequestId?: string }> {
    const context = this.contexts.get(roomName);
    if (!context) {
      throw new Error('Context not initialized for this room');
    }

    context.conversationHistory.push({
      role: 'user',
      content: userSpeech
    });

    const knowledgeAnswer = await KnowledgeBaseService.searchKnowledge(userSpeech);

    if (knowledgeAnswer) {
      const response = this.formatKnowledgeResponse(knowledgeAnswer.answer);
      context.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      return {
        response,
        needsEscalation: false
      };
    }

    const shouldEscalate = await this.shouldEscalateToHuman(userSpeech, context);

    if (shouldEscalate) {
      const helpRequest = await HelpRequestService.createHelpRequest(
        context.customerPhone,
        userSpeech,
        context.customerName,
        this.getConversationContext(context),
        roomName
      );

      const escalationResponse = this.getEscalationResponse(context.customerName);
      context.conversationHistory.push({
        role: 'assistant',
        content: escalationResponse
      });

      return {
        response: escalationResponse,
        needsEscalation: true,
        helpRequestId: String(helpRequest._id)
      };
    }

    const aiResponse = await this.generateAIResponse(userSpeech, context);
    context.conversationHistory.push({
      role: 'assistant',
      content: aiResponse
    });

    return {
      response: aiResponse,
      needsEscalation: false
    };
  }

  private async shouldEscalateToHuman(
    question: string,
    context: ConversationContext
  ): Promise<boolean> {
    try {
      const prompt = `You are an AI receptionist. Determine if this question requires human supervisor assistance.

Question: "${question}"

Escalate to human if:
- Question is about specific pricing, contracts, or custom services
- Question requires access to private customer data
- Question is complex and requires expert knowledge
- Question is about complaints or sensitive issues

Do NOT escalate if:
- Question is about general information (hours, location, contact)
- Question can be answered with common knowledge
- Question is a simple greeting or small talk

Reply with only "ESCALATE" or "ANSWER"`;

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      });

      const decision = response.choices[0].message.content?.trim().toUpperCase();
      return decision === 'ESCALATE';
    } catch (error) {
      console.error('Error determining escalation:', error);
      return true;
    }
  }

  private async generateAIResponse(
    question: string,
    context: ConversationContext
  ): Promise<string> {
    try {
      const systemPrompt = `You are a friendly AI receptionist for FrontDesk, a company providing AI-powered receptionist services. 
      
Be helpful, professional, and concise. Keep responses under 50 words for voice calls.
If you don't know something specific, politely say so and offer to connect them with a human supervisor.`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
        ...context.conversationHistory.slice(-6) // Keep last 3 exchanges
      ];

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0].message.content || 'I apologize, I need to connect you with a supervisor for this question.';
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'I apologize, I\'m having trouble processing your request. Let me connect you with a human supervisor.';
    }
  }

  private formatKnowledgeResponse(answer: string): string {
    return answer;
  }
  private getEscalationResponse(customerName?: string): string {
    const greeting = customerName ? `${customerName}` : 'there';
    return `Thank you for your question, ${greeting}. I don't have that specific information right now, but I've sent your question to our team. We'll text you the answer shortly. Is there anything else I can help you with?`;
  }

  private getConversationContext(context: ConversationContext): string {
    return context.conversationHistory
      .slice(-4)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  clearContext(roomName: string): void {
    this.contexts.delete(roomName);
  }

  getContext(roomName: string): ConversationContext | undefined {
    return this.contexts.get(roomName);
  }
}

export default new VoiceAgent();
