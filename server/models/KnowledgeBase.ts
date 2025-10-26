import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeBase extends Document {
  question: string;
  answer: string;
  category?: string;
  keywords: string[];
  sourceRequestId?: mongoose.Types.ObjectId;
  learnedFrom: 'SUPERVISOR' | 'MANUAL' | 'INITIAL';
  usageCount: number;
  lastUsed?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema: Schema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    keywords: {
      type: [String],
      default: []
    },
    sourceRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'HelpRequest'
    },
    learnedFrom: {
      type: String,
      enum: ['SUPERVISOR', 'MANUAL', 'INITIAL'],
      default: 'SUPERVISOR',
      required: true
    },
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

KnowledgeBaseSchema.index({ question: 'text', answer: 'text', keywords: 'text' });
KnowledgeBaseSchema.index({ isActive: 1, usageCount: -1 });

export default mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
