import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: string;
  isPublic: boolean;
  isEditable: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  lastModifiedBy: mongoose.Types.ObjectId;
  lastModifiedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'security',
      'performance',
      'email',
      'limits',
      'features',
      'ui',
      'analytics',
      'backup',
      'notifications'
    ],
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  validation: {
    required: Boolean,
    min: Number,
    max: Number,
    pattern: String,
    enum: [Schema.Types.Mixed]
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes
systemConfigSchema.index({ key: 1 });
systemConfigSchema.index({ category: 1 });
systemConfigSchema.index({ isPublic: 1 });

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema); 