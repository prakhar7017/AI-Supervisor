import mongoose, { Schema, Document } from 'mongoose';

export enum RequestStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  UNRESOLVED = 'UNRESOLVED'
}

export interface IHelpRequest extends Document {
  customerPhone: string;
  customerName?: string;
  question: string;
  context?: string;
  status: RequestStatus;
  supervisorResponse?: string;
  supervisorName?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  roomName?: string;
  callSid?: string;
}

const HelpRequestSchema: Schema = new Schema(
  {
    customerPhone: {
      type: String,
      required: true,
      trim: true
    },
    customerName: {
      type: String,
      trim: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    context: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
      required: true
    },
    supervisorResponse: {
      type: String,
      trim: true
    },
    supervisorName: {
      type: String,
      trim: true
    },
    respondedAt: {
      type: Date
    },
    roomName: {
      type: String,
      trim: true
    },
    callSid: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
HelpRequestSchema.index({ status: 1, createdAt: -1 });
HelpRequestSchema.index({ customerPhone: 1 });

export default mongoose.model<IHelpRequest>('HelpRequest', HelpRequestSchema);
