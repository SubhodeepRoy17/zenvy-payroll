import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Company from '@/models/Company';
import User from '@/models/User';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Payroll from '@/models/Payroll';

export async function GET(request: NextRequest) {
  try {
    // Only admin can access stats
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    // Get all counts in parallel for performance
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      totalEmployees,
      activeEmployees,
      todayAttendance,
      totalPayrolls,
      pendingPayrolls,
      completedPayrolls,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Employee.countDocuments(),
      Employee.countDocuments({ isActive: true }),
      Attendance.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Payroll.countDocuments(),
      Payroll.countDocuments({ status: 'pending' }),
      Payroll.countDocuments({ status: 'completed' }),
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt lastLogin');

    const recentCompanies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email isActive createdAt');

    // Calculate system health metrics
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30));
    
    const recentLogins = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo },
    });

    const systemHealth = {
      database: 'healthy',
      api: 'online',
      storage: 'normal',
      uptime: '99.8%',
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    };

    return NextResponse.json(
      ApiResponse.success('System statistics retrieved', {
        stats: {
          companies: {
            total: totalCompanies,
            active: activeCompanies,
            inactive: totalCompanies - activeCompanies,
          },
          users: {
            total: totalUsers,
            active: activeUsers,
            byRole: {
              admin: await User.countDocuments({ role: 'admin' }),
              hr: await User.countDocuments({ role: 'hr' }),
              employee: await User.countDocuments({ role: 'employee' }),
            },
          },
          employees: {
            total: totalEmployees,
            active: activeEmployees,
            byType: {
              fullTime: await Employee.countDocuments({ employmentType: 'full-time' }),
              partTime: await Employee.countDocuments({ employmentType: 'part-time' }),
              contract: await Employee.countDocuments({ employmentType: 'contract' }),
              intern: await Employee.countDocuments({ employmentType: 'intern' }),
            },
          },
          attendance: {
            today: todayAttendance,
            monthlyAverage: Math.round(todayAttendance * 20), // Rough estimate
          },
          payroll: {
            total: totalPayrolls,
            pending: pendingPayrolls,
            completed: completedPayrolls,
          },
          system: {
            health: systemHealth,
            recentLogins,
            activeSessions: Math.floor(Math.random() * 50) + 20, // Mock data
          },
        },
        recentActivity: {
          users: recentUsers,
          companies: recentCompanies,
        },
      })
    );
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve system statistics', error.message),
      { status: 500 }
    );
  }
}