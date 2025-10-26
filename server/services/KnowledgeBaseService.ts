import KnowledgeBase, { IKnowledgeBase } from '../models/KnowledgeBase';
import OpenAI from 'openai';

let openai: OpenAI;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

export class KnowledgeBaseService {
  async searchKnowledge(question: string): Promise<IKnowledgeBase | null> {
    try {
      const textSearchResults = await KnowledgeBase.find(
        { $text: { $search: question }, isActive: true },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5);

      if (textSearchResults.length > 0) {
        const bestMatch = await this.findBestMatch(question, textSearchResults);
        if (bestMatch) {
          await KnowledgeBase.findByIdAndUpdate(bestMatch._id, {
            $inc: { usageCount: 1 },
            lastUsed: new Date()
          });
          return bestMatch;
        }
      }

      const keywords = this.extractKeywords(question);
      const keywordResults = await KnowledgeBase.find({
        keywords: { $in: keywords },
        isActive: true
      })
        .sort({ usageCount: -1 })
        .limit(3);

      if (keywordResults.length > 0) {
        const bestMatch = await this.findBestMatch(question, keywordResults);
        if (bestMatch) {
          await KnowledgeBase.findByIdAndUpdate(bestMatch._id, {
            $inc: { usageCount: 1 },
            lastUsed: new Date()
          });
          return bestMatch;
        }
      }

      return null;
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return null;
    }
  }

  private async findBestMatch(
    question: string,
    candidates: IKnowledgeBase[]
  ): Promise<IKnowledgeBase | null> {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    try {
      const prompt = `Given the user question: "${question}"

Which of the following Q&A pairs best answers this question? Reply with only the number (1-${candidates.length}) or "NONE" if none are relevant.

${candidates.map((c, i) => `${i + 1}. Q: ${c.question}\n   A: ${c.answer}`).join('\n\n')}`;

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      });

      const answer = response.choices[0].message.content?.trim();
      if (answer && answer !== 'NONE') {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < candidates.length) {
          return candidates[index];
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding best match:', error);
      return candidates[0];
    }
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'what', 'when', 'where',
      'who', 'how', 'can', 'could', 'would', 'should', 'do', 'does', 'did'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  async addKnowledge(
    question: string,
    answer: string,
    sourceRequestId?: string,
    category?: string
  ): Promise<IKnowledgeBase> {
    const keywords = this.extractKeywords(question + ' ' + answer);

    const knowledge = new KnowledgeBase({
      question,
      answer,
      category,
      keywords,
      sourceRequestId,
      learnedFrom: 'SUPERVISOR'
    });

    return await knowledge.save();
  }

  async getLearnedAnswers(limit: number = 50): Promise<IKnowledgeBase[]> {
    return await KnowledgeBase.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sourceRequestId');
  }

  async seedInitialKnowledge(): Promise<void> {
    const count = await KnowledgeBase.countDocuments();
    if (count > 0) return;

    const initialKnowledge = [
      {
        question: 'What are your business hours?',
        answer: 'We are open Monday through Friday, 9 AM to 6 PM EST.',
        category: 'Hours',
        keywords: ['hours', 'open', 'time', 'schedule'],
        learnedFrom: 'INITIAL' as const
      },
      {
        question: 'Where are you located?',
        answer: 'Our office is located at 123 Main Street, Suite 100, New York, NY 10001.',
        category: 'Location',
        keywords: ['location', 'address', 'office', 'where'],
        learnedFrom: 'INITIAL' as const
      },
      {
        question: 'How can I contact support?',
        answer: 'You can reach our support team at support@frontdesk.com or call us at (555) 123-4567.',
        category: 'Contact',
        keywords: ['contact', 'support', 'email', 'phone', 'help'],
        learnedFrom: 'INITIAL' as const
      },
      {
        question: 'What services do you offer?',
        answer: 'We offer AI-powered receptionist services, call handling, appointment scheduling, and customer support automation.',
        category: 'Services',
        keywords: ['services', 'offer', 'provide', 'do'],
        learnedFrom: 'INITIAL' as const
      }
    ];

    await KnowledgeBase.insertMany(initialKnowledge);
    console.log('✅ Initial knowledge base seeded');
  }
}

export default new KnowledgeBaseService();
