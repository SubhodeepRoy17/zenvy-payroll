import mongoose from 'mongoose';

export interface ICompany extends mongoose.Document {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  taxId: string;
  currency: string;
  fiscalYearStart: Date;
  fiscalYearEnd: Date;
  logo?: string;
  settings: {
    workingDaysPerWeek: number;
    workingHoursPerDay: number;
    overtimeRate: number;
    leaveEncashmentRate: number;
    taxDeductionPercentage: number;
    pfDeductionPercentage: number;
    esiDeductionPercentage: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new mongoose.Schema<ICompany>({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'India',
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  website: {
    type: String,
  },
  taxId: {
    type: String,
    required: [true, 'Tax ID is required'],
    unique: true,
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'INR',
  },
  fiscalYearStart: {
    type: Date,
    required: [true, 'Fiscal year start date is required'],
  },
  fiscalYearEnd: {
    type: Date,
    required: [true, 'Fiscal year end date is required'],
  },
  logo: {
    type: String,
  },
  settings: {
    workingDaysPerWeek: {
      type: Number,
      default: 6,
      min: 1,
      max: 7,
    },
    workingHoursPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 24,
    },
    overtimeRate: {
      type: Number,
      default: 1.5,
      min: 1,
    },
    leaveEncashmentRate: {
      type: Number,
      default: 1,
      min: 0,
    },
    taxDeductionPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    pfDeductionPercentage: {
      type: Number,
      default: 12,
      min: 0,
      max: 100,
    },
    esiDeductionPercentage: {
      type: Number,
      default: 0.75,
      min: 0,
      max: 100,
    },
    probationPeriodMonths: {
      type: Number,
      default: 3,
      min: 0,
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
      min: 0,
    },
    paymentDate: {
      type: Number,
      default: 1,
      min: 1,
      max: 31,
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
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

CompanySchema.pre<ICompany>('save', function (next) {
  this.updatedAt = new Date();
});

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);