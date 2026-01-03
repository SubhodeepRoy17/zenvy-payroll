# Database Documentation

> **Zenvy Payroll System**  
> Complete MongoDB Schema and Architecture Guide

## Table of Contents

- [Overview](#overview)
- [Database Connection](#database-connection)
- [Schema Architecture](#schema-architecture)
  - [User Model](#1-user-model)
  - [Company Model](#2-company-model)
  - [Employee Model](#3-employee-model)
  - [Attendance Model](#4-attendance-model)
  - [Payroll Model](#5-payroll-model)
  - [SalaryComponent Model](#6-salarycomponent-model)
  - [AuditLog Model](#7-auditlog-model)
- [Entity Relationships](#entity-relationships)
- [Best Practices](#database-best-practices)
- [Environment Setup](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Overview

Zenvy Payroll uses **MongoDB** as its database with **Mongoose** as the ODM (Object Document Mapper). The database is designed to handle comprehensive payroll management including user authentication, employee records, attendance tracking, salary calculations, and audit logging.

**Key Features:**
- Multi-company support
- Role-based access control
- Flexible salary structures
- Complete audit trail
- Attendance tracking with overtime calculation
- Automated payroll processing

---

## Database Connection

### Configuration

**File:** `lib/dbConnect.ts`

The database connection uses a singleton pattern with caching to prevent multiple connections in serverless environments (Next.js API routes).

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Singleton connection caching
let cached = global.mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Features:**
- ✅ Connection pooling
- ✅ Automatic reconnection
- ✅ Serverless optimization
- ✅ Error handling

---

## Schema Architecture

### 1. User Model

**Collection:** `users`  
**File:** `models/User.ts`

#### Overview
Manages authentication and user accounts with role-based access control.

#### Schema

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | String | ✅ | max: 50 chars | User's full name |
| `email` | String | ✅ | unique, lowercase | Email address |
| `password` | String | ✅ | min: 6 chars | Hashed password |
| `role` | String | ✅ | enum: admin/hr/employee | User role |
| `employee` | ObjectId | ❌ | ref: Employee | Employee reference |
| `company` | ObjectId | ❌ | ref: Company | Company reference |
| `department` | String | ❌ | - | Department name |
| `position` | String | ❌ | - | Job position |
| `salary` | Number | ❌ | - | Base salary |
| `hireDate` | Date | ❌ | - | Date of joining |
| `avatar` | String | ❌ | - | Profile picture URL |
| `isActive` | Boolean | ✅ | default: true | Account status |
| `lastLogin` | Date | ❌ | - | Last login time |
| `createdAt` | Date | ✅ | auto | Creation timestamp |

#### Features

**🔐 Password Security:**
```typescript
// Auto-hash on save (bcrypt with 10 salt rounds)
UserSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Password comparison method
async comparePassword(candidatePassword: string): Promise<boolean>
```

**📧 Email Validation:**
- Regex pattern: `/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/`
- Automatic lowercase conversion

**🔒 Security:**
- Password excluded from queries by default (`select: false`)
- Unique email constraint

**Indexes:**
- `email` (unique)

---

### 2. Company Model

**Collection:** `companies`  
**File:** `models/Company.ts`

#### Overview
Stores organization information, payroll settings, and company-specific configurations.

#### Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | String | ✅ | - | Company name (max 100) |
| `address` | String | ✅ | - | Full address |
| `city` | String | ✅ | - | City |
| `state` | String | ✅ | - | State/Province |
| `country` | String | ✅ | 'India' | Country |
| `postalCode` | String | ✅ | - | Postal code |
| `phone` | String | ✅ | - | Contact number |
| `email` | String | ✅ | - | Company email |
| `website` | String | ❌ | - | Website URL |
| `taxId` | String | ✅ | - | Tax ID (unique) |
| `currency` | String | ✅ | 'INR' | Currency code |
| `fiscalYearStart` | Date | ✅ | - | FY start date |
| `fiscalYearEnd` | Date | ✅ | - | FY end date |
| `logo` | String | ❌ | - | Logo URL |
| `settings` | Object | ✅ | - | Payroll settings |
| `isActive` | Boolean | ✅ | true | Active status |
| `createdAt` | Date | ✅ | auto | Creation time |
| `updatedAt` | Date | ✅ | auto | Update time |

#### Settings Object

| Field | Default | Range | Description |
|-------|---------|-------|-------------|
| `workingDaysPerWeek` | 6 | 1-7 | Working days |
| `workingHoursPerDay` | 8 | 1-24 | Work hours |
| `overtimeRate` | 1.5 | min: 1 | OT multiplier |
| `leaveEncashmentRate` | 1 | min: 0 | Leave rate |
| `taxDeductionPercentage` | 10 | 0-100 | Tax % |
| `pfDeductionPercentage` | 12 | 0-100 | PF % |
| `esiDeductionPercentage` | 0.75 | 0-100 | ESI % |
| `probationPeriodMonths` | 3 | min: 0 | Probation period |
| `noticePeriodDays` | 30 | min: 0 | Notice period |
| `paymentDate` | 1 | 1-31 | Salary date |
| `currencySymbol` | '₹' | - | Symbol |

**Indexes:**
- `taxId` (unique)

---

### 3. Employee Model

**Collection:** `employees`  
**File:** `models/Employee.ts`

#### Overview
Comprehensive employee records including personal details, bank information, and salary structure.

#### Main Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | ✅ | User reference (unique) |
| `employeeId` | String | ✅ | Employee ID (unique, uppercase) |
| `company` | ObjectId | ✅ | Company reference |
| `department` | String | ✅ | Department |
| `designation` | String | ✅ | Job title |
| `reportingManager` | ObjectId | ❌ | Manager reference (self) |
| `employmentType` | String | ✅ | full-time/part-time/contract/intern |
| `joiningDate` | Date | ✅ | Join date |
| `confirmationDate` | Date | ❌ | Confirmation date |
| `exitDate` | Date | ❌ | Exit date |
| `workLocation` | String | ✅ | Work location |
| `bankDetails` | Object | ✅ | Bank information |
| `panNumber` | String | ✅ | PAN (uppercase) |
| `aadhaarNumber` | String | ✅ | Aadhaar number |
| `uanNumber` | String | ✅ | UAN (PF number) |
| `esiNumber` | String | ❌ | ESI number |
| `salaryStructure` | ObjectId | ✅ | Salary component ref |
| `leaves` | Object | ✅ | Leave balance |
| `isActive` | Boolean | ✅ | Active status |

#### Nested Objects

**Bank Details:**
```typescript
{
  accountNumber: String (required),
  accountHolderName: String (required),
  bankName: String (required),
  branch: String (required),
  ifscCode: String (required, uppercase)
}
```

**Leaves:**
```typescript
{
  earnedLeaves: Number (default: 0),
  casualLeaves: Number (default: 0),
  sickLeaves: Number (default: 0)
}
```

#### Business Rules

**⚠️ One User Per Company:**
Pre-save validation ensures a user can only have ONE active employee record across all companies.

```typescript
// Validation in pre-save hook
const existingEmployee = await Employee.findOne({
  user: this.user,
  isActive: true,
  _id: { $ne: this._id }
});
```

**Indexes:**
- `employeeId` + `company` (compound)
- `user` (unique)

---

### 4. Attendance Model

**Collection:** `attendances`  
**File:** `models/Attendance.ts`

#### Overview
Daily attendance tracking with automatic work hours and overtime calculation.

#### Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `employee` | ObjectId | ✅ | - | Employee reference |
| `date` | Date | ✅ | - | Attendance date |
| `status` | String | ✅ | 'absent' | present/absent/half-day/leave/holiday |
| `checkIn` | Date | ❌ | - | Clock-in time |
| `checkOut` | Date | ❌ | - | Clock-out time |
| `hoursWorked` | Number | ❌ | 0 | Total hours |
| `overtimeHours` | Number | ❌ | 0 | OT hours |
| `notes` | String | ❌ | - | Additional notes |
| `isRegularized` | Boolean | ❌ | false | Regularized flag |
| `regularizedBy` | ObjectId | ❌ | - | User who regularized |
| `regularizedAt` | Date | ❌ | - | Regularization time |
| `createdAt` | Date | ✅ | auto | Creation time |
| `updatedAt` | Date | ✅ | auto | Update time |

#### Auto-Calculations

**🕐 Hours Worked:**
```typescript
hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60)
// Automatically calculated on save
```

**⏰ Overtime:**
```typescript
if (hoursWorked > 8) {
  overtimeHours = hoursWorked - 8
} else {
  overtimeHours = 0
}
```

#### Business Rules

- **One Record Per Day:** Unique constraint on `employee` + `date`
- **Precision:** Hours rounded to 2 decimal places
- **Regularization:** Allows HR to correct attendance records

**Indexes:**
- `employee` + `date` (unique, compound)
- `date`
- `status`

---

### 5. Payroll Model

**Collection:** `payrolls`  
**File:** `models/Payroll.ts`

#### Overview
Monthly payroll records with earnings, deductions, and payment processing.

#### Main Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employee` | ObjectId | ✅ | Employee reference |
| `month` | Number | ✅ | Month (1-12) |
| `year` | Number | ✅ | Year (2000-2100) |
| `periodFrom` | Date | ✅ | Period start |
| `periodTo` | Date | ✅ | Period end |
| `totalWorkingDays` | Number | ✅ | Working days |
| `presentDays` | Number | ✅ | Days present |
| `absentDays` | Number | ✅ | Days absent |
| `leaveDays` | Number | ✅ | Leave days |
| `basicSalary` | Number | ✅ | Base salary |
| `earnings` | Array | ✅ | Earnings list |
| `deductions` | Array | ✅ | Deductions list |
| `grossEarnings` | Number | ✅ | Total earnings |
| `totalDeductions` | Number | ✅ | Total deductions |
| `netSalary` | Number | ✅ | Take-home pay |
| `taxDeducted` | Number | ✅ | TDS amount |
| `pfContribution` | Number | ✅ | PF amount |
| `esiContribution` | Number | ✅ | ESI amount |
| `status` | String | ✅ | Payroll status |
| `paymentDate` | Date | ❌ | Payment date |
| `paymentMethod` | String | ❌ | Payment method |
| `transactionId` | String | ❌ | Transaction ID |
| `remarks` | String | ❌ | Additional notes |
| `approvedBy` | ObjectId | ❌ | Approver reference |
| `approvedAt` | Date | ❌ | Approval time |
| `isLocked` | Boolean | ✅ | Lock status |

#### Earnings/Deductions Structure

```typescript
{
  component: String,    // Component name
  amount: Number,       // Amount
  isTaxable: Boolean    // Taxable flag
}
```

#### Payroll Status Workflow

```
draft → calculated → approved → paid
                        ↓
                   cancelled
```

| Status | Description |
|--------|-------------|
| `draft` | Initial state |
| `calculated` | Calculations complete |
| `approved` | Approved by HR/Admin |
| `paid` | Payment processed |
| `cancelled` | Cancelled payroll |

#### Payment Methods
- `bank-transfer`
- `cheque`
- `cash`

#### Business Rules

**🔒 Unique Payroll:**
One payroll per employee per month-year
```typescript
// Compound unique index
{ employee: 1, month: 1, year: 1 }
```

**🔐 Lock Mechanism:**
`isLocked: true` prevents modifications after approval

**Indexes:**
- `employee` + `month` + `year` (unique, compound)
- `status`
- `periodFrom` + `periodTo` (compound)

---

### 6. SalaryComponent Model

**Collection:** `salarycomponents`  
**File:** `models/SalaryComponent.ts`

#### Overview
Configurable salary components with flexible calculation methods.

#### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | Component name |
| `type` | String | ✅ | earning/deduction |
| `category` | String | ✅ | Component category |
| `calculationType` | String | ✅ | fixed/percentage/formula |
| `value` | Number | ✅ | Base value |
| `formula` | String | ❌ | Custom formula |
| `percentageOf` | String | ❌ | Reference component |
| `isTaxable` | Boolean | ✅ | Tax applicable |
| `isRecurring` | Boolean | ✅ | Recurring monthly |
| `description` | String | ❌ | Description |
| `company` | ObjectId | ✅ | Company reference |
| `isActive` | Boolean | ✅ | Active status |

#### Categories

**Earnings:**
- `basic` - Basic salary
- `allowance` - HRA, DA, etc.
- `reimbursement` - Travel, medical
- `bonus` - Performance bonus

**Deductions:**
- `tax` - Income tax
- `provident-fund` - PF contribution
- `esi` - ESI contribution
- `loan` - Loan repayment
- `other` - Miscellaneous

#### Calculation Types

**1. Fixed Amount**
```typescript
{
  calculationType: 'fixed',
  value: 5000
}
// Result: ₹5,000
```

**2. Percentage**
```typescript
{
  calculationType: 'percentage',
  value: 10,
  percentageOf: 'Basic Salary'
}
// If Basic = ₹50,000
// Result: ₹5,000 (10% of 50,000)
```

**3. Formula**
```typescript
{
  calculationType: 'formula',
  formula: '(basic * 0.5) + 1000'
}
// Custom calculation
```

**Indexes:**
- `name` + `company` (compound)

---

### 7. AuditLog Model

**Collection:** `auditlogs`  
**File:** `models/AuditLog.ts`

#### Overview
Complete audit trail for all system activities, security, and compliance.

#### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | ✅ | User who performed action |
| `action` | String | ✅ | Action type |
| `entity` | String | ✅ | Affected entity |
| `entityId` | ObjectId | ❌ | Entity ID |
| `changes` | Mixed | ❌ | Change details |
| `ipAddress` | String | ❌ | User's IP |
| `userAgent` | String | ❌ | Browser info |
| `timestamp` | Date | ✅ | Action time |

#### Action Types

**CRUD Operations:**
- `create`, `update`, `delete`, `read`

**Authentication:**
- `login`, `logout`

**Payroll:**
- `approve`, `reject`, `calculate`, `pay`

**Attendance:**
- `clock-in`, `clock-out`, `leave-request`

**Data Operations:**
- `export`, `import`, `download`, `upload`, `reset`

**Salary:**
- `salary-view`

#### Entity Types

```
user, employee, attendance, payroll, salary-slip,
company, salary-component, leave, holiday,
department, designation, tax, deduction, earning, report
```

#### Usage Example

```typescript
await AuditLog.create({
  user: userId,
  action: 'approve',
  entity: 'payroll',
  entityId: payrollId,
  changes: {
    status: { from: 'calculated', to: 'approved' }
  },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

#### Key Features
- **Complete Traceability:** Who did what, when
- **Change Tracking:** Stores before/after state
- **Security:** IP and browser tracking
- **Compliance:** Meet audit requirements

**Indexes:**
- `user` + `timestamp` (compound, desc)
- `entity` + `entityId` (compound)
- `action` + `timestamp` (compound, desc)
- `timestamp` (desc)

---

## Entity Relationships

### Relationship Diagram

```
┌─────────────┐
│   Company   │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬─────────────────┐
       │              │              │                 │
       ▼              ▼              ▼                 ▼
┌─────────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────┐
│SalaryComp.  │ │   User   │ │   Employee    │ │ AuditLog │
└─────────────┘ └────┬─────┘ └───────┬───────┘ └──────────┘
                     │               │
                     └───────┬───────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌───────────┐     ┌──────────┐
              │Attendance │     │ Payroll  │
              └───────────┘     └──────────┘
```

### Detailed Relationships

#### 1. User ↔ Employee (1:1)
```typescript
User.employee → Employee._id
Employee.user → User._id
```
- Each User has ONE Employee record
- Each Employee belongs to ONE User
- Enforced by unique constraint

#### 2. Company ↔ Employee (1:N)
```typescript
Company._id ← Employee.company
```
- One Company has MANY Employees
- Each Employee belongs to ONE Company

#### 3. Employee ↔ Payroll (1:N)
```typescript
Employee._id ← Payroll.employee
```
- One Employee has MANY Payrolls (monthly)
- Each Payroll belongs to ONE Employee

#### 4. Employee ↔ Attendance (1:N)
```typescript
Employee._id ← Attendance.employee
```
- One Employee has MANY Attendance records
- Each Attendance belongs to ONE Employee

#### 5. Employee ↔ SalaryComponent (N:1)
```typescript
Employee.salaryStructure → SalaryComponent._id
```
- Many Employees can share same structure
- Each Employee has ONE salary structure

#### 6. Employee ↔ Employee (Self-reference)
```typescript
Employee.reportingManager → Employee._id
```
- Creates organizational hierarchy
- Manager-subordinate relationship

#### 7. User ↔ AuditLog (1:N)
```typescript
User._id ← AuditLog.user
```
- One User generates MANY audit logs
- Each log belongs to ONE User

---

## Database Best Practices

### 1. Connection Management

```typescript
// ✅ Good: Reuse connection
const conn = await dbConnect();

// ❌ Bad: Create new connection each time
mongoose.connect(MONGODB_URI);
```

**Key Points:**
- Use singleton pattern
- Leverage connection caching
- Handle errors gracefully

### 2. Indexing Strategy

```typescript
// ✅ Good: Indexed query
Employee.findOne({ employeeId: 'EMP001' });

// ❌ Bad: Full collection scan
Employee.find({ notes: { $regex: /text/ } });
```

**Index Types:**
- **Unique:** Email, employeeId, taxId
- **Compound:** employee + date, employee + month + year
- **Descending:** Timestamp fields for recent-first

### 3. Query Optimization

```typescript
// ✅ Good: Select specific fields
Employee.find({ isActive: true })
  .select('name email department');

// ❌ Bad: Load entire document
Employee.find({ isActive: true });
```

**Tips:**
- Use `.select()` for specific fields
- Implement pagination for large datasets
- Use `.lean()` for read-only queries

### 4. Data Validation

```typescript
// Schema-level validation
{
  email: {
    type: String,
    required: [true, 'Email required'],
    match: [/regex/, 'Invalid email']
  }
}

// Pre-save validation
UserSchema.pre('save', async function() {
  // Custom validation logic
});
```

### 5. Security

**Password Handling:**
```typescript
// ✅ Auto-hash on save
password: { type: String, select: false }

// ✅ Compare passwords
user.comparePassword(plainPassword);
```

**Sensitive Data:**
- Encrypt PAN, Aadhaar in production
- Use field-level encryption
- Implement access controls

### 6. Soft Deletes

```typescript
// ✅ Good: Soft delete
Employee.updateOne({ _id }, { isActive: false });

// ❌ Bad: Hard delete
Employee.deleteOne({ _id });
```

**Benefits:**
- Maintain data integrity
- Enable data recovery
- Preserve audit trail

### 7. Audit Trail

```typescript
// Log all critical operations
await AuditLog.create({
  user: userId,
  action: 'update',
  entity: 'employee',
  entityId: employeeId,
  changes: { field: { from: old, to: new } }
});
```

---

## Environment Variables

### Required Configuration

Create a `.env.local` file in the project root:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zenvy-payroll?retryWrites=true&w=majority
```

### Connection String Format

```
mongodb+srv://[username]:[password]@[cluster]/[database]?[options]
```

**Components:**
- `username`: MongoDB user
- `password`: User password
- `cluster`: MongoDB Atlas cluster URL
- `database`: Database name (e.g., zenvy-payroll)
- `options`: Connection options

### Recommended Options

```
retryWrites=true          # Auto-retry write operations
w=majority                # Write concern for durability
maxPoolSize=10            # Connection pool size
serverSelectionTimeoutMS=5000  # Server selection timeout
```

### Example (Development)

```env
MONGODB_URI=mongodb://localhost:27017/zenvy-payroll-dev
```

### Example (Production)

```env
MONGODB_URI=mongodb+srv://prod_user:secure_password@prod-cluster.mongodb.net/zenvy-payroll-prod?retryWrites=true&w=majority&maxPoolSize=50
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Timeout

**Error:** `MongooseServerSelectionError: connect ETIMEDOUT`

**Solutions:**
- ✅ Verify `MONGODB_URI` is correct
- ✅ Check network connectivity
- ✅ Whitelist IP in MongoDB Atlas
- ✅ Check firewall settings

#### 2. Duplicate Key Error

**Error:** `E11000 duplicate key error`

**Solutions:**
```typescript
// ✅ Use findOneAndUpdate with upsert
await User.findOneAndUpdate(
  { email },
  userData,
  { upsert: true, new: true }
);

// ✅ Check unique constraints
// - User: email
// - Employee: user, employeeId + company
// - Company: taxId
```

#### 3. Slow Queries

**Solutions:**
```typescript
// ✅ Add indexes
EmployeeSchema.index({ department: 1, isActive: 1 });

// ✅ Use explain() to analyze
await Employee.find({ dept: 'IT' }).explain('executionStats');

// ✅ Optimize aggregations
await Employee.aggregate([
  { $match: { isActive: true } },
  { $project: { name: 1, email: 1 } }
]);
```

#### 4. Memory Issues

**Solutions:**
```typescript
// ✅ Implement pagination
const page = 1, limit = 50;
await Employee.find()
  .limit(limit)
  .skip((page - 1) * limit);

// ✅ Use lean() for read-only
const employees = await Employee.find().lean();

// ✅ Stream large datasets
const cursor = Employee.find().cursor();
for await (const doc of cursor) {
  // Process one at a time
}
```

#### 5. Validation Errors

**Error:** `ValidationError: Path required`

**Solutions:**
```typescript
// ✅ Check required fields
const requiredFields = ['name', 'email', 'password'];
requiredFields.forEach(field => {
  if (!userData[field]) {
    throw new Error(`${field} is required`);
  }
});

// ✅ Provide default values
{
  isActive: { type: Boolean, default: true }
}
```

### Performance Monitoring

**Query Analysis:**
```typescript
// Check query execution time
const start = Date.now();
await Employee.find({ isActive: true });
console.log(`Query took: ${Date.now() - start}ms`);

// Explain plan
const plan = await Employee
  .find({ department: 'IT' })
  .explain('executionStats');
console.log(plan.executionStats);
```

**Index Usage:**
```typescript
// Check if index is used
{
  executionStats: {
    executionTimeMillis: 5,
    totalKeysExamined: 1,
    totalDocsExamined: 1
  }
}

// ✅ Good: Keys examined = Docs examined
// ❌ Bad: Docs examined >> Keys examined (no index)
```

---

## Additional Resources

### Maintenance Scripts

**Seed Script:** `scripts/seed.js`
- Initial data setup
- Create default companies
- Generate test data

**Fix Duplicates:** `scripts/fix-duplicate-employees.js`
- Resolve duplicate employee records
- Data cleanup operations

### Data Backup

**Recommended Strategy:**

| Frequency | Retention | Location |
|-----------|-----------|----------|
| Daily | 7 days | MongoDB Atlas |
| Weekly | 4 weeks | Cloud storage |
| Monthly | 12 months | Archive |
| Yearly | Indefinite | Compliance |

**Backup Commands:**
```bash
# Export database
mongodump --uri="$MONGODB_URI" --out=./backup

# Import database
mongorestore --uri="$MONGODB_URI" ./backup
```

### Compliance & Privacy

**Sensitive Fields:**
- 🔐 `User.password` - Hashed, never exposed
- 🔐 `Employee.panNumber` - Tax identifier
- 🔐 `Employee.aadhaarNumber` - National ID
- 🔐 `Employee.bankDetails` - Financial info

**Recommendations:**
1. Enable MongoDB encryption at rest
2. Implement field-level encryption
3. Role-based access control
4. Complete audit logging
5. Data retention policies
6. GDPR compliance workflows

---

## Schema Summary

| Model | Collection | Purpose | Key Features |
|-------|-----------|---------|--------------|
| **User** | users | Authentication | Password hashing, roles |
| **Company** | companies | Organization | Multi-tenant, settings |
| **Employee** | employees | HR records | Bank details, leaves |
| **Attendance** | attendances | Time tracking | Auto OT calculation |
| **Payroll** | payrolls | Salary processing | Status workflow, locking |
| **SalaryComponent** | salarycomponents | Salary structure | Flexible calculations |
| **AuditLog** | auditlogs | Activity tracking | Complete audit trail |

### Database Statistics

**Total Models:** 7  
**Total Indexes:** 20+  
**Supported Operations:** CRUD, Aggregations, Transactions  
**Schema Version:** 1.0

---

## Quick Reference

### Common Queries

**Find Active Employees:**
```typescript
await Employee.find({ isActive: true })
  .populate('user', 'name email')
  .populate('company', 'name');
```

**Get Monthly Payroll:**
```typescript
await Payroll.find({
  month: 12,
  year: 2024,
  status: 'approved'
}).populate('employee');
```

**Check Today's Attendance:**
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

await Attendance.find({
  date: today,
  status: 'present'
});
```

**Get User with Employee:**
```typescript
await User.findById(userId)
  .populate({
    path: 'employee',
    populate: { path: 'company' }
  });
```

### Useful Aggregations

**Department-wise Count:**
```typescript
await Employee.aggregate([
  { $match: { isActive: true } },
  { $group: {
    _id: '$department',
    count: { $sum: 1 }
  }}
]);
```

**Monthly Salary Summary:**
```typescript
await Payroll.aggregate([
  { $match: { month: 12, year: 2024 } },
  { $group: {
    _id: null,
    totalGross: { $sum: '$grossEarnings' },
    totalNet: { $sum: '$netSalary' },
    count: { $sum: 1 }
  }}
]);
```

---

## Support & Documentation

**MongoDB Documentation:** https://docs.mongodb.com  
**Mongoose Documentation:** https://mongoosejs.com/docs  

**Project Structure:**
```
models/
├── User.ts              # Authentication
├── Company.ts           # Organization
├── Employee.ts          # HR records
├── Attendance.ts        # Time tracking
├── Payroll.ts           # Salary processing
├── SalaryComponent.ts   # Salary structure
└── AuditLog.ts          # Activity logs

lib/
└── dbConnect.ts         # Database connection
```

---

## License & Credits

**Database Design:** Zenvy Payroll System  
**Version:** 1.0  
**Last Updated:** January 2026

---

**End of Database Documentation**
