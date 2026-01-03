import mongoose from 'mongoose';

export interface IAttendance extends mongoose.Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday';
  checkIn?: Date;
  checkOut?: Date;
  hoursWorked?: number;
  overtimeHours?: number;
  notes?: string;
  isRegularized?: boolean;
  regularizedBy?: mongoose.Types.ObjectId;
  regularizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new mongoose.Schema<IAttendance>({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave', 'holiday'],
    default: 'absent',
  },
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  hoursWorked: {
    type: Number,
    default: 0,
  },
  overtimeHours: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
  },
  isRegularized: {
    type: Boolean,
    default: false,
  },
  regularizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  regularizedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

AttendanceSchema.pre<IAttendance>('save', function (next) {
  this.updatedAt = new Date();
  
  // Auto-calculate hours worked if both check-in and check-out exist
  if (this.checkIn && this.checkOut) {
    const hours = (this.checkOut.getTime() - this.checkIn.getTime()) / (1000 * 60 * 60);
    this.hoursWorked = parseFloat(hours.toFixed(2));
    
    // Calculate overtime (more than 8 hours)
    if (hours > 8) {
      this.overtimeHours = parseFloat((hours - 8).toFixed(2));
    } else {
      this.overtimeHours = 0;
    }
  }
  
});

// Index for faster queries
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);