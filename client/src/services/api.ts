import axios from 'axios';
import { HelpRequest, KnowledgeBase, RequestStatus, Statistics } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const helpRequestsApi = {
  getAll: (status?: RequestStatus) => 
    api.get<HelpRequest[]>('/help-requests', { params: { status } }),
  
  getPending: () => 
    api.get<HelpRequest[]>('/help-requests/pending'),
  
  getStats: () => 
    api.get<Statistics>('/help-requests/stats'),
  
  getById: (id: string) => 
    api.get<HelpRequest>(`/help-requests/${id}`),
  
  respond: (id: string, data: { supervisorResponse: string; supervisorName: string; resolved?: boolean }) =>
    api.post<HelpRequest>(`/help-requests/${id}/respond`, data)
};

export const knowledgeApi = {
  getAll: (limit?: number) => 
    api.get<KnowledgeBase[]>('/knowledge', { params: { limit } }),
  
  search: (question: string) => 
    api.post<{ found: boolean; answer: KnowledgeBase | null }>('/knowledge/search', { question }),
  
  add: (data: { question: string; answer: string; category?: string }) =>
    api.post<KnowledgeBase>('/knowledge', data)
};

export const livekitApi = {
  getToken: (roomName: string, participantName: string, customerPhone: string) =>
    api.post<{ token: string; url: string }>('/livekit/token', {
      roomName,
      participantName,
      customerPhone
    }),
  
  processSpeech: (roomName: string, speech: string) =>
    api.post<{ response: string; needsEscalation: boolean; helpRequestId?: string }>('/livekit/process-speech', {
      roomName,
      speech
    }),
  
  endCall: (roomName: string) =>
    api.post('/livekit/end-call', { roomName })
};

export default api;
