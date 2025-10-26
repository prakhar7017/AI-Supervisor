import HelpRequest, { IHelpRequest, RequestStatus } from '../models/HelpRequest';
import KnowledgeBaseService from './KnowledgeBaseService';

export class HelpRequestService {
  /**
   * Create a new help request and notify supervisor
   */
  async createHelpRequest(
    customerPhone: string,
    question: string,
    customerName?: string,
    context?: string,
    roomName?: string
  ): Promise<IHelpRequest> {
    const helpRequest = new HelpRequest({
      customerPhone,
      customerName,
      question,
      context,
      status: RequestStatus.PENDING,
      roomName
    });

    await helpRequest.save();

    console.log(`📝 Help request created: ${helpRequest._id}`);
    return helpRequest;
  }

  /**
   * Supervisor responds to help request
   */
  async respondToRequest(
    requestId: string,
    supervisorResponse: string,
    supervisorName: string,
    resolved: boolean = true
  ): Promise<IHelpRequest> {
    const helpRequest = await HelpRequest.findById(requestId);
    if (!helpRequest) {
      throw new Error('Help request not found');
    }

    // Update help request
    helpRequest.supervisorResponse = supervisorResponse;
    helpRequest.supervisorName = supervisorName;
    helpRequest.status = resolved ? RequestStatus.RESOLVED : RequestStatus.UNRESOLVED;
    helpRequest.respondedAt = new Date();
    await helpRequest.save();

    // If resolved, add to knowledge base
    if (resolved && supervisorResponse) {
      await KnowledgeBaseService.addKnowledge(
        helpRequest.question,
        supervisorResponse,
        String(helpRequest._id)
      );
      console.log(`Knowledge base updated with new answer`);
    }

    console.log(`Help request ${requestId} ${resolved ? 'resolved' : 'marked unresolved'}`);
    return helpRequest;
  }

  /**
   * Get all pending help requests
   */
  async getPendingRequests(): Promise<IHelpRequest[]> {
    return await HelpRequest.find({ status: RequestStatus.PENDING })
      .sort({ createdAt: -1 });
  }

  /**
   * Get all help requests with filters
   */
  async getAllRequests(
    status?: RequestStatus,
    limit: number = 100
  ): Promise<IHelpRequest[]> {
    const query = status ? { status } : {};
    return await HelpRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get help request by ID
   */
  async getRequestById(requestId: string): Promise<IHelpRequest | null> {
    return await HelpRequest.findById(requestId);
  }

  /**
   * Get request statistics
   */
  async getStatistics() {
    const [pending, resolved, unresolved, total] = await Promise.all([
      HelpRequest.countDocuments({ status: RequestStatus.PENDING }),
      HelpRequest.countDocuments({ status: RequestStatus.RESOLVED }),
      HelpRequest.countDocuments({ status: RequestStatus.UNRESOLVED }),
      HelpRequest.countDocuments()
    ]);

    return {
      pending,
      resolved,
      unresolved,
      total,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : '0'
    };
  }
}

export default new HelpRequestService();
