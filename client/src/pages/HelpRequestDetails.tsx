import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { helpRequestsApi } from '../services/api';
import { HelpRequest } from '../types';
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function HelpRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supervisorName: '',
    supervisorResponse: '',
    resolved: true
  });

  useEffect(() => {
    if (id) {
      loadRequest(id);
    }
  }, [id]);

  const loadRequest = async (requestId: string) => {
    try {
      const response = await helpRequestsApi.getById(requestId);
      setRequest(response.data);
    } catch (error) {
      console.error('Error loading request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.supervisorName || !formData.supervisorResponse) return;

    setSubmitting(true);
    try {
      await helpRequestsApi.respond(id, formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
      </div>
    );
  }

  const isPending = request.status === 'PENDING';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Request Details</h1>
          <p className="text-gray-600">
            {request.customerName || request.customerPhone}
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <div className="mt-1">
            {request.status === 'PENDING' && (
              <span className="badge badge-pending">Pending</span>
            )}
            {request.status === 'RESOLVED' && (
              <span className="badge badge-resolved">Resolved</span>
            )}
            {request.status === 'UNRESOLVED' && (
              <span className="badge badge-unresolved">Unresolved</span>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Customer Phone</label>
          <p className="mt-1 text-gray-900">{request.customerPhone}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Question</label>
          <p className="mt-1 text-gray-900 text-lg">{request.question}</p>
        </div>

        {request.context && (
          <div>
            <label className="text-sm font-medium text-gray-600">Conversation Context</label>
            <pre className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
              {request.context}
            </pre>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600">Received</label>
          <p className="mt-1 text-gray-900">
            {format(new Date(request.createdAt), 'PPpp')}
          </p>
        </div>

        {request.supervisorResponse && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Supervisor Response</label>
              <p className="mt-1 text-gray-900">{request.supervisorResponse}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Responded By</label>
              <p className="mt-1 text-gray-900">{request.supervisorName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Responded At</label>
              <p className="mt-1 text-gray-900">
                {request.respondedAt && format(new Date(request.respondedAt), 'PPpp')}
              </p>
            </div>
          </>
        )}
      </div>

      {isPending && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Provide Response
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="supervisorName" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                id="supervisorName"
                required
                value={formData.supervisorName}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="supervisorResponse" className="block text-sm font-medium text-gray-700">
                Answer
              </label>
              <textarea
                id="supervisorResponse"
                required
                rows={4}
                value={formData.supervisorResponse}
                onChange={(e) => setFormData({ ...formData, supervisorResponse: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
                placeholder="Provide a clear answer to the customer's question..."
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="resolved"
                  checked={formData.resolved}
                  onChange={() => setFormData({ ...formData, resolved: true })}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Resolved</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="resolved"
                  checked={!formData.resolved}
                  onChange={() => setFormData({ ...formData, resolved: false })}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Cannot Resolve</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Response'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
