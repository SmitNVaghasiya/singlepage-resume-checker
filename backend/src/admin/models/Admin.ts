import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  permissions: string[];
  ipWhitelist: string[];
  sessionTimeout: number;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastPasswordChange: Date;
  passwordExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  hasPermission(permission: string): boolean;
  isPasswordExpired(): boolean;
}

const adminSchema = new Schema<IAdmin>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  permissions: {
    type: [String],
    default: [
      'view_users',
      'manage_users',
      'view_analytics',
      'view_analyses',
      'view_logs',
      'manage_system',
      'export_data',
      'bulk_operations',
      'audit_trail',
      'system_config'
    ]
  },
  ipWhitelist: {
    type: [String],
    default: []
  },
  sessionTimeout: {
    type: Number,
    default: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  passwordExpiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChange = new Date();
    
    // Set password expiry to 90 days from now
    this.passwordExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
adminSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Check if admin has specific permission
adminSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

// Check if password is expired
adminSchema.methods.isPasswordExpired = function(): boolean {
  if (!this.passwordExpiryDate) return false;
  return new Date() > this.passwordExpiryDate;
};

// Create indexes
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ permissions: 1 });

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema); 