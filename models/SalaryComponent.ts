import mongoose from 'mongoose';

export interface ISalaryComponent extends mongoose.Document {
  name: string;
  type: 'earning' | 'deduction';
  category: 'basic' | 'allowance' | 'reimbursement' | 'bonus' | 'tax' | 'provident-fund' | 'esi' | 'loan' | 'other';
  calculationType: 'fixed' | 'percentage' | 'formula';
  value: number;
  formula?: string;
  percentageOf?: string; // Reference to another component name
  isTaxable: boolean;
  isRecurring: boolean;
  description?: string;
  company: mongoose.Types.ObjectId; // Reference to Company
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryComponentSchema = new mongoose.Schema<ISalaryComponent>({
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['earning', 'deduction'],
    required: [true, 'Component type is required'],
  },
  category: {
    type: String,
    enum: ['basic', 'allowance', 'reimbursement', 'bonus', 'tax', 'provident-fund', 'esi', 'loan', 'other'],
    required: [true, 'Category is required'],
  },
  calculationType: {
    type: String,
    enum: ['fixed', 'percentage', 'formula'],
    required: [true, 'Calculation type is required'],
  },
  value: {
    type: Number,
    required: [true, 'Value is required'],
    min: 0,
  },
  formula: {
    type: String,
  },
  percentageOf: {
    type: String,
  },
  isTaxable: {
    type: Boolean,
    default: true,
  },
  isRecurring: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
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

SalaryComponentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
});

// Create a compound unique index for name + company
SalaryComponentSchema.index({ name: 1, company: 1 }, { unique: true });

export default mongoose.models.SalaryComponent || mongoose.model<ISalaryComponent>('SalaryComponent', SalaryComponentSchema);