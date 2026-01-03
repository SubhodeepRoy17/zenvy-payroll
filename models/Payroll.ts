import mongoose from 'mongoose';

export interface IPayroll extends mongoose.Document {
  employee: mongoose.Types.ObjectId; // Reference to Employee
  month: number;
  year: number;
  periodFrom: Date;
  periodTo: Date;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  basicSalary: number;
  earnings: Array<{
    component: string;
    amount: number;
    isTaxable: boolean;
  }>;
  deductions: Array<{
    component: string;
    amount: number;
    isTaxable: boolean;
  }>;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  taxDeducted: number;
  pfContribution: number;
  esiContribution: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  paymentDate?: Date;
  paymentMethod?: 'bank-transfer' | 'cheque' | 'cash';
  transactionId?: string;
  remarks?: string;
  approvedBy?: mongoose.Types.ObjectId; // Reference to User
  approvedAt?: Date;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new mongoose.Schema<IPayroll>({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required'],
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2000,
    max: 2100,
  },
  periodFrom: {
    type: Date,
    required: [true, 'Period start date is required'],
  },
  periodTo: {
    type: Date,
    required: [true, 'Period end date is required'],
  },
  totalWorkingDays: {
    type: Number,
    required: [true, 'Total working days is required'],
    min: 0,
  },
  presentDays: {
    type: Number,
    default: 0,
    min: 0,
  },
  absentDays: {
    type: Number,
    default: 0,
    min: 0,
  },
  leaveDays: {
    type: Number,
    default: 0,
    min: 0,
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: 0,
  },
  earnings: [{
    component: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    isTaxable: {
      type: Boolean,
      default: true,
    },
  }],
  deductions: [{
    component: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    isTaxable: {
      type: Boolean,
      default: true,
    },
  }],
  grossEarnings: {
    type: Number,
    required: [true, 'Gross earnings is required'],
    min: 0,
  },
  totalDeductions: {
    type: Number,
    required: [true, 'Total deductions is required'],
    min: 0,
  },
  netSalary: {
    type: Number,
    required: [true, 'Net salary is required'],
    min: 0,
  },
  taxDeducted: {
    type: Number,
    default: 0,
    min: 0,
  },
  pfContribution: {
    type: Number,
    default: 0,
    min: 0,
  },
  esiContribution: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'paid', 'cancelled'],
    default: 'draft',
  },
  paymentDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cheque', 'cash'],
  },
  transactionId: {
    type: String,
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  isLocked: {
    type: Boolean,
    default: false,
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

// Compound index for unique payroll per employee per month-year
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Index for querying by status and date range
PayrollSchema.index({ status: 1 });
PayrollSchema.index({ periodFrom: 1, periodTo: 1 });

PayrollSchema.pre('save', function (next) {
  this.updatedAt = new Date();
});

export default mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', PayrollSchema);