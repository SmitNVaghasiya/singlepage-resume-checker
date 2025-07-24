import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  type: 'system' | 'security' | 'performance' | 'user' | 'analysis' | 'backup';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  targetAudience: 'admin' | 'user' | 'all';
  recipients: mongoose.Types.ObjectId[];
  readBy: mongoose.Types.ObjectId[];
  metadata: Record<string, any>;
  expiresAt?: Date;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: ['system', 'security', 'performance', 'user', 'analysis', 'backup'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'system_health',
      'security_alert',
      'performance_issue',
      'user_activity',
      'analysis_complete',
      'analysis_failed',
      'backup_success',
      'backup_failed',
      'data_export',
      'maintenance',
      'feature_update'
    ],
    index: true
  },
  targetAudience: {
    type: String,
    enum: ['admin', 'user', 'all'],
    default: 'admin',
    index: true
  },
  recipients: [{
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  }],
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
notificationSchema.index({ type: 1, severity: 1, createdAt: -1 });
notificationSchema.index({ targetAudience: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ category: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 