# Frontend Documentation

> **Zenvy Payroll System**  
> Complete Frontend Architecture Guide

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Application Architecture](#application-architecture)
  - [Routing & Pages](#routing--pages)
  - [Authentication Flow](#authentication-flow)
  - [State Management](#state-management)
  - [Component Architecture](#component-architecture)
- [Key Features](#key-features)
- [Pages Documentation](#pages-documentation)
- [Components](#components)
- [Hooks & Context](#hooks--context)
- [Services](#services)
- [Styling & Theme](#styling--theme)
- [Responsive Design](#responsive-design)
- [Best Practices](#best-practices)

---

## Overview

Zenvy Payroll is a modern, responsive payroll management system built with **Next.js 16** and **React 19**. The application supports three user roles (Admin, HR, Employee) with role-based dashboards and features.

**Key Characteristics:**
- Server-side rendering (SSR) with Next.js App Router
- Type-safe with TypeScript
- Fully responsive (mobile-first approach)
- Real-time updates with client-side state
- Optimistic UI updates
- PDF generation & download capabilities

---

## Tech Stack

### Core Framework
```json
{
  "next": "16.0.10",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "typescript": "^5"
}
```

### UI Components & Styling
- **Tailwind CSS 4.1.9** - Utility-first CSS
- **shadcn/ui** - Accessible component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **tailwind-merge** - Merge Tailwind classes

### Forms & Validation
- **React Hook Form 7.60.0** - Form management
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers** - RHF + Zod integration

### Data Visualization & UI
- **Recharts 2.15.4** - Chart library
- **date-fns 4.1.0** - Date utilities
- **Sonner** - Toast notifications
- **jsPDF** - PDF generation

### State & Authentication
- **React Context API** - Global state
- **JWT** - Token-based auth
- **bcryptjs** - Password hashing

---

## Project Structure

```
zenvy-payroll/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   └── register/
│   │       └── page.tsx         # Registration page
│   │
│   ├── (dashboard)/             # Dashboard group
│   │   ├── dashboard/           # HR Dashboard
│   │   ├── employee-dashboard/  # Employee Dashboard
│   │   ├── admin-dashboard/     # Admin Dashboard (future)
│   │   ├── employees/           # Employee management
│   │   ├── payroll/            # Payroll management
│   │   ├── salary-slips/       # Salary slip management
│   │   ├── employee-salary-slips/ # Employee view
│   │   └── settings/           # Settings pages
│   │
│   ├── api/                    # API routes (backend)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
│
├── components/                  # React components
│   ├── Layout/
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── Sidebar.tsx         # Sidebar navigation
│   │
│   ├── Common/                 # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   │
│   ├── Employees/
│   │   └── EditEmployeeDialog.tsx
│   │
│   ├── Payroll/
│   │   └── PayrollRunDialog.tsx
│   │
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       └── ... (30+ components)
│
├── context/
│   └── AuthContext.tsx         # Authentication context
│
├── hooks/
│   ├── useAuth.ts             # Auth hook
│   ├── use-toast.ts           # Toast notifications
│   └── use-mobile.ts          # Mobile detection
│
├── services/                   # API service layer
│   ├── api-service.ts         # Base API
│   ├── employee-service.ts    # Employee APIs
│   ├── payroll-service.ts     # Payroll APIs
│   └── salary-slip-service.ts # Salary slip APIs
│
├── types/                      # TypeScript types
│   ├── auth.ts
│   ├── employee.ts
│   ├── payroll.ts
│   └── salary-slip.ts
│
├── lib/
│   └── utils.ts               # Utility functions
│
└── public/                     # Static assets
    └── images/
```

---

## Application Architecture

### Routing & Pages

Zenvy uses **Next.js App Router** with file-based routing:

#### Public Routes
- `/` - Landing page
- `/login` - User authentication
- `/register` - HR registration

#### Protected Routes (HR/Admin)
- `/dashboard` - HR dashboard
- `/employees` - Employee list & management
- `/payroll` - Payroll processing
- `/salary-slips` - Salary slip management
- `/settings` - System settings

#### Protected Routes (Employee)
- `/employee-dashboard` - Employee dashboard
- `/employee-salary-slips` - Personal salary slips
- `/employee-settings` - Personal settings

#### Route Protection
Implemented via `middleware.ts`:

```typescript
// Protected routes by role
const protectedRoutes: Record<string, string[]> = {
  '/dashboard': ['admin', 'hr'],
  '/employees': ['admin', 'hr'],
  '/payroll': ['admin', 'hr'],
  '/employee-dashboard': ['employee'],
  '/employee-salary-slips': ['employee'],
}
```

**Flow:**
1. Check if route requires authentication
2. Verify JWT token from cookies
3. Validate user role matches route requirements
4. Redirect to appropriate dashboard if mismatch
5. Inject user info into request headers

---

### Authentication Flow

#### Login Process

```typescript
// 1. User submits credentials
const handleLogin = async (email, password, role) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role })
  })
  
  // 2. Server validates and returns JWT
  const { token, user } = await response.json()
  
  // 3. Token stored in httpOnly cookie
  // 4. User context updated
  setUser(user)
  
  // 5. Redirect based on role
  const redirectPath = getRedirectPath(user.role)
  router.replace(redirectPath)
}
```

#### Role-Based Redirection

```typescript
const getRedirectPath = (role: string) => {
  switch (role) {
    case 'admin': return '/admin-dashboard'
    case 'hr': return '/dashboard'
    case 'employee': return '/employee-dashboard'
    default: return '/dashboard'
  }
}
```

#### Token Management
- **Storage:** httpOnly cookies (secure)
- **Validation:** JWT middleware
- **Refresh:** Automatic on page load
- **Expiry:** Configurable (default: 7 days)

---

### State Management

#### Context API Pattern

**AuthContext** - Global authentication state:

```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email, password, role) => Promise<void>
  logout: () => Promise<void>
  register: (data) => Promise<void>
}
```

**Usage in Components:**

```typescript
const { user, isAuthenticated, login } = useAuth()

// Check authentication
if (!isAuthenticated) {
  router.push('/login')
}

// Access user data
console.log(user.name, user.role)
```

#### Local State Patterns

**Data Fetching:**
```typescript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  fetchData()
}, [dependencies])
```

**Pagination:**
```typescript
const [filters, setFilters] = useState({
  page: 1,
  limit: 10,
  sortBy: 'employeeId'
})

const [pagination, setPagination] = useState({
  page: 1,
  total: 0,
  pages: 1
})
```

---

### Component Architecture

#### Composition Pattern

```typescript
// Layout components wrap page content
<Sidebar />
<main>
  <Navbar title="Dashboard" />
  <PageContent>
    <Card>
      <Button />
    </Card>
  </PageContent>
</main>
```

#### Component Types

**1. Layout Components**
- `Sidebar.tsx` - Navigation sidebar
- `Navbar.tsx` - Top navigation bar
- Responsive, role-aware

**2. Common Components**
- `Button.tsx` - Reusable button
- `Card.tsx` - Content container
- `Input.tsx` - Form input
- Consistent styling via CVA

**3. Feature Components**
- `EditEmployeeDialog.tsx` - Modal dialogs
- `PayrollRunDialog.tsx` - Feature-specific
- Encapsulated logic

**4. UI Components (shadcn)**
- `button.tsx` - Base button
- `dialog.tsx` - Modal system
- `badge.tsx` - Status badges
- `table.tsx` - Data tables

---

## Key Features

### 1. Role-Based Access Control (RBAC)

**Implementation:**
- Middleware validates routes
- Context provides user role
- UI conditionally renders features

```typescript
// Show admin features only
{user?.role === 'admin' && (
  <Button>Admin Panel</Button>
)}

// Multiple roles
{['admin', 'hr'].includes(user?.role) && (
  <Link href="/payroll">Payroll</Link>
)}
```

### 2. Responsive Design

**Breakpoints:**
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

**Mobile-First Approach:**
```typescript
// Detect mobile
const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768)
  }
  
  checkMobile()
  window.addEventListener('resize', checkMobile)
  return () => window.removeEventListener('resize', checkMobile)
}, [])

// Conditional rendering
{isMobile ? (
  <MobileView />
) : (
  <DesktopView />
)}
```

### 3. Client-Side Data Fetching

**Service Layer Pattern:**
```typescript
// Service handles API calls
const response = await EmployeeService.getEmployees({
  page: 1,
  limit: 10,
  search: 'john'
})

if (response.success) {
  setEmployees(response.data.employees)
}
```

### 4. Toast Notifications

**Usage:**
```typescript
import { toast } from 'sonner'

// Success
toast.success('Employee created successfully!')

// Error
toast.error('Failed to save data')

// Info
toast.info('Processing payroll...')
```

### 5. PDF Generation

**Implementation:**
```typescript
const handleDownload = async (slipId: string) => {
  try {
    toast.info('Downloading salary slip...')
    await SalarySlipService.downloadSalarySlip(slipId)
    toast.success('Downloaded successfully')
  } catch (error) {
    toast.error('Download failed')
  }
}
```

---

## Pages Documentation

### Login Page (`/login`)

**Features:**
- Role-based login (Admin, HR, Employee)
- Remember me functionality
- Password visibility toggle
- OAuth integration (GitHub, Google)
- Demo credentials display

**Key Components:**
```typescript
const [role, setRole] = useState<'admin' | 'hr' | 'employee'>('hr')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')

// Role selector tabs
<div className="flex p-1 bg-muted rounded-lg">
  <button onClick={() => setRole('hr')}>HR Admin</button>
  <button onClick={() => setRole('admin')}>Admin</button>
  <button onClick={() => setRole('employee')}>Employee</button>
</div>
```

**Authentication Flow:**
1. Select role
2. Enter credentials
3. Submit form → API call
4. Store JWT token
5. Redirect based on role

**Redirects:**
- Admin → `/admin-dashboard`
- HR → `/dashboard`
- Employee → `/employee-dashboard`

---

### Register Page (`/register`)

**Features:**
- HR Manager account creation
- Password strength validation
- Terms of service acceptance
- Email confirmation

**Validation:**
```typescript
// Minimum password length
if (password.length < 6) {
  toast.error('Password must be at least 6 characters')
  return
}

// Password match
if (password !== confirmPassword) {
  toast.error('Passwords do not match')
  return
}
```

---

### HR Dashboard (`/dashboard`)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Stats Cards (4)                         │
├─────────────────────────────────────────┤
│ Quick Actions (3)                       │
├─────────────────────┬───────────────────┤
│ Recent Hires (2/3)  │ AI Insights       │
│                     │ Quick Stats       │
└─────────────────────┴───────────────────┘
```

**Key Stats:**
- Total Employees
- Monthly Payroll
- Pending Approvals
- Tax Compliance

**Quick Actions:**
```typescript
const actions = [
  {
    title: 'Run Payroll',
    icon: DollarSign,
    onClick: () => router.push('/payroll')
  },
  {
    title: 'Monthly Report',
    icon: FileText,
    onClick: () => downloadReport()
  },
  {
    title: 'Add Employee',
    icon: UserPlus,
    onClick: () => router.push('/employees/create')
  }
]
```

**Data Fetching:**
```typescript
useEffect(() => {
  const fetchDashboardData = async () => {
    const [employees, payroll, slips] = await Promise.allSettled([
      EmployeeService.getEmployees(),
      PayrollService.getPayrollSummary(),
      SalarySlipService.getSalarySlips()
    ])
    
    // Process and set state
  }
  
  fetchDashboardData()
}, [])
```

---

### Employee Dashboard (`/employee-dashboard`)

**Layout:**
```
┌─────────────────────┬───────────────────┐
│ Attendance          │ Monthly Summary   │
├─────────────────────┴───────────────────┤
│ Latest Salary Card (Primary)           │
├─────────────────────┬───────────────────┤
│ Quick Actions       │ Today's Status    │
├─────────────────────┤                   │
│ Upcoming Holidays   │                   │
└─────────────────────┴───────────────────┘
```

**Clock In/Out:**
```typescript
const handleClockInOut = async () => {
  try {
    let response
    
    if (!isClockedIn) {
      response = await EmployeeService.clockIn()
      setIsClockedIn(true)
      toast.success('Clocked in successfully')
    } else {
      response = await EmployeeService.clockOut()
      setIsClockedIn(false)
      toast.success('Clocked out successfully')
    }
  } catch (error) {
    toast.error('Failed to update attendance')
  }
}
```

**Attendance Tracking:**
- Real-time clock in/out
- Hours worked calculation
- Overtime tracking
- Monthly attendance summary

---

### Employees Page (`/employees`)

**Features:**
- Searchable employee list
- Filterable by department/status
- Pagination (10/page desktop, 5/page mobile)
- Inline actions (Edit, View, Deactivate)
- Bulk operations

**Table Structure:**
```typescript
<table>
  <thead>
    <tr>
      <th>Employee</th>
      <th>ID</th>
      <th>Department & Role</th>
      <th>Joining Date</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {employees.map(emp => (
      <tr onClick={() => viewProfile(emp)}>
        <td>
          <Avatar />
          <div>
            <div>{emp.name}</div>
            <div>{emp.email}</div>
          </div>
        </td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

**Pagination:**
```typescript
// Calculate range
const totalPages = Math.ceil(total / limit)
const startIndex = (page - 1) * limit
const endIndex = startIndex + limit
const currentData = data.slice(startIndex, endIndex)

// Navigation
<Button onClick={() => setPage(page - 1)} disabled={page === 1}>
  Previous
</Button>
<Button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
  Next
</Button>
```

**Search & Filter:**
```typescript
// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    fetchEmployees()
  }, 500)
  
  return () => clearTimeout(timer)
}, [searchTerm])

// Filter by department
const filtered = employees.filter(emp => 
  filters.department === 'all' || emp.department === filters.department
)
```

---

### Payroll Page (`/payroll`)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Summary Stats (4 cards)                 │
├─────────────────────────────────────────┤
│ Active Cycles (Current month)           │
├─────────────────────────────────────────┤
│ Previous Cycles (History)               │
└─────────────────────────────────────────┘
```

**Payroll Run Dialog:**
```typescript
<PayrollRunDialog
  isOpen={isRunDialogOpen}
  onClose={() => setIsRunDialogOpen(false)}
  onSubmit={handleRunPayroll}
/>

const handleRunPayroll = async (data) => {
  const response = await PayrollService.runPayroll({
    month: data.month,
    year: data.year,
    periodFrom: startDate,
    periodTo: endDate,
    employeeIds: data.employeeIds
  })
  
  if (response.success) {
    toast.success('Payroll processed successfully')
    fetchPayrollRuns()
  }
}
```

**Status Workflow:**
```
draft → calculated → approved → paid
```

---

### Salary Slips Page (`/salary-slips`)

**Features:**
- List all salary slips (HR view)
- Filter by month/year/status
- Pagination (mobile responsive)
- Download PDF
- Approve/Mark as paid

**Mobile Carousel Stats:**
```typescript
// Auto-sliding stats carousel
useEffect(() => {
  if (window.innerWidth < 768) {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 4)
    }, 5000)
    
    return () => clearInterval(interval)
  }
}, [])
```

**Actions:**
```typescript
const actions = {
  download: (slipId) => SalarySlipService.downloadSalarySlip(slipId),
  approve: (slipId) => PayrollService.approvePayroll(slipId),
  markPaid: (slipId) => PayrollService.markAsPaid(slipId, { method: 'bank-transfer' })
}
```

---

### Employee Salary Slips (`/employee-salary-slips`)

**Layout:**
```
┌───────────┬─────────────────────────────┐
│ Slip List │ Detailed View               │
│           │                             │
│ • Jan 24  │ Header                      │
│ • Dec 23  │ ├─ Employee Details         │
│ • Nov 23  │ ├─ Pay Period               │
│           │ ├─ Earnings                 │
│           │ ├─ Deductions               │
│           │ └─ Net Salary               │
└───────────┴─────────────────────────────┘
```

**Mobile Tabs:**
```typescript
// Switch between list and detail
const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')

<div className="flex border-b lg:hidden">
  <button onClick={() => setViewMode('list')}>List</button>
  <button onClick={() => setViewMode('detail')}>Details</button>
</div>
```

**Number to Words Conversion:**
```typescript
const convertNumberToWords = (num: number): string => {
  // Convert ₹45,000 → "Forty Five Thousand Rupees"
  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)
  
  return `${toWords(rupees)} Rupees ${
    paise > 0 ? `and ${toWords(paise)} Paise` : ''
  }`
}
```

---

## Components

### Layout Components

#### Sidebar (`components/Layout/Sidebar.tsx`)

**Features:**
- Collapsible on mobile
- Role-based menu items
- Active route highlighting
- User profile display

**Structure:**
```typescript
const menuItems = {
  hr: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Employees', href: '/employees' },
    { icon: DollarSign, label: 'Payroll', href: '/payroll' },
    { icon: FileText, label: 'Salary Slips', href: '/salary-slips' }
  ],
  employee: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/employee-dashboard' },
    { icon: FileText, label: 'Salary Slips', href: '/employee-salary-slips' },
    { icon: Calendar, label: 'Attendance', href: '/attendance' }
  ]
}
```

#### Navbar (`components/Layout/Navbar.tsx`)

**Features:**
- Page title display
- User menu dropdown
- Notifications bell
- Theme toggle (future)

**Props:**
```typescript
interface NavbarProps {
  title?: string
}
```

---

### Common Components

#### Button (`components/Common/Button.tsx`)

**Variants:**
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8"
      }
    }
  }
)
```

#### Card (`components/Common/Card.tsx`)

**Structure:**
```typescript
<Card
  title="Card Title"
  description="Card description"
  footer={<Button>Action</Button>}
>
  <CardContent />
</Card>
```

#### Input (`components/Common/Input.tsx`)

**Props:**
```typescript
interface InputProps {
  label?: string
  error?: string
  type?: string
  placeholder?: string
  required?: boolean
}
```

---

### Feature Components

#### EditEmployeeDialog

**Features:**
- Form with validation
- Pre-filled data
- Optimistic updates
- Error handling

**Usage:**
```typescript
<EditEmployeeDialog
  employee={selectedEmployee}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={refetchEmployees}
/>
```

#### PayrollRunDialog

**Features:**
- Month/year selector
- Employee selection
- Force override option
- Validation

**State:**
```typescript
const [formData, setFormData] = useState({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  employeeIds: [],
  force: false
})
```

---

## Hooks & Context

### useAuth Hook

**API:**
```typescript
const {
  user,              // Current user object
  isAuthenticated,   // Boolean auth status
  isLoading,         // Loading state
  login,            // Login function
  logout,           // Logout function
  register          // Register function
} = useAuth()
```

**Implementation:**
```typescript
// Check authentication
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/login')
  }
}, [isAuthenticated, isLoading])

// Role-based rendering
{user?.role === 'admin' && <AdminPanel />}
```

### use-toast Hook

**API:**
```typescript
import { toast } from 'sonner'

toast.success('Success message')
toast.error('Error message')
toast.info('Info message')
toast.loading('Loading...')
```

### use-mobile Hook

**Usage:**
```typescript
const isMobile = useMobile()

return isMobile ? <MobileView /> : <DesktopView />
```

---

## Services

### API Service Layer

All API calls go through service layer for:
- Consistent error handling
- Request/response transformation
- Token management
- Type safety

#### EmployeeService

```typescript
class EmployeeService {
  static async getEmployees(filters?: {
    page?: number
    limit?: number
    search?: string
    department?: string
    isActive?: boolean
  }) {
    return apiService.get('/employees', { params: filters })
  }
  
  static async createEmployee(data: EmployeeCreateFormData) {
    return apiService.post('/employees/create-with-user', data)
  }
  
  static async getDashboardData() {
    return apiService.get('/employees/dashboard')
  }
  
  static async clockIn() {
    return apiService.post('/attendance/clock')
  }
}
```

#### PayrollService

```typescript
class PayrollService {
  static async runPayroll(data: {
    month: number
    year: number
    employeeIds?: string[]
    force?: boolean
  }) {
    return apiService.post('/payroll/run', data)
  }
  
  static async approvePayroll(id: string) {
    return apiService.post(`/payroll/${id}/approve`)
  }
}
```

#### SalarySlipService

```typescript
class SalarySlipService {
  static async downloadSalarySlip(id: string) {
    const response = await apiService.get(
      `/salary-slips/${id}/download`,
      { responseType: 'blob' }
    )
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = `salary-slip-${id}.pdf`
    link.click()
  }
}
```

---

## Styling & Theme

### Tailwind Configuration

**Colors:**
```typescript
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))"
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))"
  }
}
```

### CSS Variables

**globals.css:**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --accent: 240 4.8% 95.9%;
  --destructive: 0 84.2% 60.2%;
  --border: 240 5.9% 90%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### Component Styling

**Class Variance Authority:**
```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { /* ... */ },
      size: { /* ... */ }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)
```

**Tailwind Merge:**
```typescript
import { cn } from '@/lib/utils'

<Button className={cn(
  "default-classes",
  isPrimary && "primary-classes",
  className
)} />
```

---

## Responsive Design

### Mobile-First Strategy

**Breakpoint Usage:**
```typescript
// Hide on mobile
<div className="hidden md:block">Desktop Only</div>

// Show on mobile
<div className="md:hidden">Mobile Only</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

### Responsive Tables

**Desktop:**
```tsx
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Department</th>
      <th>Actions</th>
    </tr>
  </thead>
</table>
```

**Mobile:**
```tsx
<div className="md:hidden">
  {data.map(item => (
    <div className="p-4 border rounded-lg">
      <div className="font-bold">{item.name}</div>
      <div className="text-sm text-muted-foreground">{item.email}</div>
      <div className="flex justify-between mt-2">
        <Badge>{item.department}</Badge>
        <Button size="sm">Actions</Button>
      </div>
    </div>
  ))}
</div>
```

## 📱 Responsive Tables (Mobile Optimization)

### Action Handling for Mobile
\`\`\`jsx
<Button
  size=\"sm\"
  variant=\"outline\"
  onClick={() => handleAction(item.id)}
>
  View
</Button>
\`\`\`

### Design Principles
- **Stacked Cards**: Replace dense tables with stacked cards on mobile
- **Information Priority**: Show only key information (name, status, primary action)
- **Action Management**: Move secondary actions into dropdowns or modals
- **Touch Optimization**: Ensure touch-friendly spacing (minimum 44px tap targets)

## ⚡ Performance Optimization

### Code Splitting & Lazy Loading
\`\`\`javascript
import dynamic from 'next/dynamic'

const PayrollRunDialog = dynamic(
  () => import('@/components/Payroll/PayrollRunDialog'),
  { ssr: false }
)
\`\`\`

**Benefits:**
- Reduced initial bundle size
- Faster First Contentful Paint (FCP)
- Improved Time To Interactive (TTI)

### Memoization
\`\`\`javascript
const MemoizedStatsCard = React.memo(StatsCard)

const calculatedTotal = useMemo(() => {
  return slips.reduce((sum, slip) => sum + slip.netSalary, 0)
}, [slips])
\`\`\`

**Use For:**
- Salary calculations
- Chart data processing
- Large list rendering
- Derived state values

### List Optimization
\`\`\`javascript
{salarySlips.map((slip) => (
  <SalarySlipCard key={slip.id} slip={slip} />
))}
\`\`\`

**Guidelines:**
- Always use stable keys (id, not index)
- Avoid inline functions inside large lists
- Extract list items into memoized components

## 🛡️ Error Handling Strategy

### API Error Handling
\`\`\`javascript
try {
  const response = await EmployeeService.getEmployees()
  setEmployees(response.data)
} catch (error: any) {
  toast.error(error.message || 'Something went wrong')
}
\`\`\`

### Global Error States
\`\`\`jsx
{error && (
  <div className=\"p-4 border border-destructive text-destructive rounded-lg\">
    Failed to load data. Please try again.
  </div>
)}
\`\`\`

## ♿ Accessibility (a11y)

### Implemented Features
- Semantic HTML elements
- Keyboard navigable components
- ARIA labels for icons and actions
- Focus-visible states
- Screen-reader friendly buttons

### Example
\`\`\`jsx
<button aria-label=\"Download salary slip\">
  <Download />
</button>
\`\`\`

## 🔒 Security Best Practices (Frontend)

- No sensitive data stored in localStorage
- JWT stored in httpOnly cookies
- Role-based UI rendering
- Server-side route protection
- CSRF-safe API calls

### Role Validation
\`\`\`javascript
// Never trust frontend role alone
if (!['admin', 'hr'].includes(user.role)) return null
\`\`\`

## 🧪 Testing Strategy (Recommended)

### Unit Testing
- Component rendering
- Utility functions
- Hooks logic

**Suggested Stack:** Jest + React Testing Library
\`\`\`javascript
render(<Button>Click me</Button>)
expect(screen.getByText('Click me')).toBeInTheDocument()
\`\`\`

### Integration Testing
- Auth flow
- Role-based routing
- API-service integration

## 🏗️ Best Practices

### Code Quality
- Strict TypeScript enabled
- ESLint + Prettier configuration
- Consistent naming conventions
- Small, focused components

### Folder Discipline
- Feature-based component grouping
- Centralized services
- Shared UI in \`/components/ui\`
- No business logic in UI components

### State Management
- Global state only when necessary
- Prefer local state for UI behavior
- Avoid prop drilling using Context

## 🚀 Future Enhancements

- React Query / TanStack Query integration
- WebSockets for real-time payroll updates
- Dark mode toggle
- PWA support for offline salary slip access
- Internationalization (i18n) support

## 🎯 Conclusion

The Zenvy Payroll Frontend is designed as a scalable, secure, and high-performance enterprise-grade application.

### Key Strengths:
- Clean architecture with separation of concerns
- Role-based experience tailored for HR and Employees
- Mobile-first, responsive UI
- Strong type safety and predictable state
- Production-ready patterns and best practices

This frontend is ready for growth, easy to maintain, and aligned with modern React & Next.js standards." > README.md && echo "README.md created successfully!"
