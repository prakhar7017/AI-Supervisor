import { useEffect, useState } from 'react';
import { knowledgeApi } from '../services/api';
import { KnowledgeBase } from '../types';
import { Brain, TrendingUp, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function LearnedAnswers() {
  const [knowledge, setKnowledge] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      const response = await knowledgeApi.getAll();
      setKnowledge(response.data);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const supervisorLearned = knowledge.filter(k => k.learnedFrom === 'SUPERVISOR');
  const initialKnowledge = knowledge.filter(k => k.learnedFrom === 'INITIAL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learned Answers</h1>
        <p className="mt-2 text-gray-600">
          Knowledge base that the AI uses to answer customer questions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Brain className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Answers</p>
              <p className="text-2xl font-semibold text-gray-900">{knowledge.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">From Supervisors</p>
              <p className="text-2xl font-semibold text-gray-900">{supervisorLearned.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Initial Knowledge</p>
              <p className="text-2xl font-semibold text-gray-900">{initialKnowledge.length}</p>
            </div>
          </div>
        </div>
      </div>

      {supervisorLearned.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Learned from Supervisors
          </h2>
          <div className="space-y-4">
            {supervisorLearned.map((item) => (
              <KnowledgeCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {initialKnowledge.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Initial Knowledge Base
          </h2>
          <div className="space-y-4">
            {initialKnowledge.map((item) => (
              <KnowledgeCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {knowledge.length === 0 && (
        <div className="card text-center py-12">
          <Brain className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No knowledge yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            The AI will learn from supervisor responses
          </p>
        </div>
      )}
    </div>
  );
}

function KnowledgeCard({ item }: { item: KnowledgeBase }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-900">Q:</span>
            <span className="text-gray-900">{item.question}</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-sm font-medium text-green-600 mt-0.5">A:</span>
            <span className="text-gray-700">{item.answer}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className={`badge ${
            item.learnedFrom === 'SUPERVISOR' ? 'bg-green-100 text-green-800' :
            item.learnedFrom === 'INITIAL' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {item.learnedFrom}
          </span>
          {item.category && (
            <span className="badge bg-gray-100 text-gray-700">
              {item.category}
            </span>
          )}
          <span className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Used {item.usageCount} times
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
