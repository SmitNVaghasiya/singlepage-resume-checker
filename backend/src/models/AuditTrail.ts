import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditTrail extends Document {
  adminId: mongoose.Types.ObjectId;
  adminUsername: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
  metadata: Record<string, any>;
}

const auditTrailSchema = new Schema<IAuditTrail>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  adminUsername: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'view_users',
      'view_analytics',
      'view_analyses',
      'update_user_status',
      'bulk_update_users',
      'export_data',
      'view_system_health',
      'system_config_change',
      'password_change',
      'permission_change',
      'data_cleanup',
      'backup_created',
      'backup_restored',
      'security_alert',
      'email_sent',
      'user_messaged',
      'announcement_created'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'users',
      'analyses',
      'analytics',
      'system',
      'admin',
      'data',
      'security',
      'communication',
      'backup'
    ]
  },
  resourceId: {
    type: String
  },
  details: {
    type: Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
auditTrailSchema.index({ adminId: 1, timestamp: -1 });
auditTrailSchema.index({ action: 1, timestamp: -1 });
auditTrailSchema.index({ resource: 1, timestamp: -1 });
auditTrailSchema.index({ severity: 1, timestamp: -1 });
auditTrailSchema.index({ status: 1, timestamp: -1 });
auditTrailSchema.index({ 'metadata.sessionId': 1 });

// TTL index to automatically delete old audit logs (keep for 1 year)
auditTrailSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AuditTrail = mongoose.model<IAuditTrail>('AuditTrail', auditTrailSchema); 