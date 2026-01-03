import mongoose from 'mongoose';

export interface IEmployee extends mongoose.Document {
  user: mongoose.Types.ObjectId; // Reference to User model
  employeeId: string;
  company: mongoose.Types.ObjectId; // Reference to Company model
  department: string;
  designation: string;
  reportingManager?: mongoose.Types.ObjectId; // Self-reference
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  joiningDate: Date;
  confirmationDate?: Date;
  exitDate?: Date;
  workLocation: string;
  bankDetails: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    branch: string;
    ifscCode: string;
  };
  panNumber: string;
  aadhaarNumber: string;
  uanNumber: string;
  esiNumber?: string;
  salaryStructure: mongoose.Types.ObjectId; // Reference to SalaryComponent
  leaves: {
    earnedLeaves: number;
    casualLeaves: number;
    sickLeaves: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new mongoose.Schema<IEmployee>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true,
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    uppercase: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference is required'],
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
  },
  reportingManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time',
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required'],
  },
  confirmationDate: {
    type: Date,
  },
  exitDate: {
    type: Date,
  },
  workLocation: {
    type: String,
    required: [true, 'Work location is required'],
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      uppercase: true,
    },
  },
  panNumber: {
    type: String,
    required: [true, 'PAN number is required'],
    uppercase: true,
  },
  aadhaarNumber: {
    type: String,
    required: [true, 'Aadhaar number is required'],
  },
  uanNumber: {
    type: String,
    required: [true, 'UAN number is required'],
  },
  esiNumber: {
    type: String,
  },
  salaryStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryComponent',
    required: [true, 'Salary structure is required'],
  },
  leaves: {
    earnedLeaves: {
      type: Number,
      default: 0,
    },
    casualLeaves: {
      type: Number,
      default: 0,
    },
    sickLeaves: {
      type: Number,
      default: 0,
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

EmployeeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
});

EmployeeSchema.pre('save', async function (next) {
  // Check if this user already has an active employee record in ANY company
  const existingEmployee = await this.model('Employee').findOne({
    user: this.user,
    isActive: true,
    _id: { $ne: this._id } // Exclude current document during update
  }) as IEmployee;
  
  if (existingEmployee) {
    const error = new Error(`User already has an active employee record in company: ${existingEmployee.company}`);
    return;
  }
});

// Index for faster queries
EmployeeSchema.index({ employeeId: 1, company: 1 });
EmployeeSchema.index({ user: 1 }, { unique: true });

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);