import mongoose from 'mongoose';

export interface IAuditLog extends mongoose.Document {
  user: mongoose.Types.ObjectId; // Reference to User who performed action
  action: string;
  entity: string;
  entityId?: mongoose.Types.ObjectId;
  changes: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new mongoose.Schema<IAuditLog>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'create', 'update', 'delete', 'login', 'logout', 
      'approve', 'reject', 'calculate', 'pay', 'read',
      'clock-in', 'clock-out', 'leave-request', 'salary-view',
      'export', 'import', 'download', 'upload', 'reset'
    ],
  },
  entity: {
    type: String,
    required: [true, 'Entity is required'],
    enum: [
      'user', 'employee', 'attendance', 'payroll', 
      'salary-slip', 'company', 'salary-component',
      'leave', 'holiday', 'department', 'designation',
      'tax', 'deduction', 'earning', 'report'
    ],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster querying
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);