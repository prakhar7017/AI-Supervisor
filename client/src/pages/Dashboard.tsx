import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { helpRequestsApi } from '../services/api';
import { HelpRequest, Statistics, RequestStatus } from '../types';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [pendingRequests, setPendingRequests] = useState<HelpRequest[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        helpRequestsApi.getPending(),
        helpRequestsApi.getStats()
      ]);
      setPendingRequests(requestsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage help requests and monitor AI receptionist performance
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Unresolved"
            value={stats.unresolved}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            icon={TrendingUp}
            color="blue"
          />
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Pending Help Requests
          </h2>
          <span className="badge badge-pending">
            {pendingRequests.length} pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              All customer questions have been answered!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number | string;
  icon: any;
  color: 'yellow' | 'green' | 'red' | 'blue';
}) {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: HelpRequest }) {
  return (
    <Link
      to={`/requests/${request._id}`}
      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">
              {request.customerName || request.customerPhone}
            </span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-gray-700 mb-2">{request.question}</p>
          {request.context && (
            <p className="text-sm text-gray-500 italic">
              Context: {request.context.split('\n')[0]}...
            </p>
          )}
        </div>
        <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0 ml-4" />
      </div>
    </Link>
  );
}
