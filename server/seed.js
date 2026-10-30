import bcrypt from 'bcryptjs';

export function getSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const hash = (pwd) => bcrypt.hashSync(pwd, salt);

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Create timestamps for earlier today to simulate active working hours
  const createPastTimestamp = (hoursAgo, minutesAgo = 0) => {
    const d = new Date(now.getTime() - (hoursAgo * 60 + minutesAgo) * 60 * 1000);
    return d.toISOString();
  };

  const users = [
    {
      id: 'EMP-1001',
      name: 'Sarah Connor',
      email: 'admin@company.com',
      phone: '+1 555-0101',
      password: hash('admin123'),
      plainDemoPassword: 'admin123',
      role: 'admin',
      department: 'Management',
      designation: 'Operations Director & Admin',
      joiningDate: '2022-01-15',
      salary: '$125,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    },
    {
      id: 'EMP-1002',
      name: 'David Miller',
      email: 'manager@company.com',
      phone: '+1 555-0102',
      password: hash('manager123'),
      plainDemoPassword: 'manager123',
      role: 'manager',
      department: 'Engineering',
      designation: 'Engineering Lead & Project Manager',
      joiningDate: '2022-06-01',
      salary: '$105,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    },
    {
      id: 'EMP-1003',
      name: 'Alex Johnson',
      email: 'alex@company.com',
      phone: '+1 555-0103',
      password: hash('employee123'),
      plainDemoPassword: 'employee123',
      role: 'employee',
      department: 'Engineering',
      designation: 'Senior Full Stack Developer',
      joiningDate: '2023-02-10',
      salary: '$88,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    },
    {
      id: 'EMP-1004',
      name: 'Elena Rostova',
      email: 'elena@company.com',
      phone: '+1 555-0104',
      password: hash('password123'),
      plainDemoPassword: 'password123',
      role: 'employee',
      department: 'Engineering',
      designation: 'Frontend React/Vue Specialist',
      joiningDate: '2023-04-18',
      salary: '$82,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    },
    {
      id: 'EMP-1005',
      name: 'Marcus Chen',
      email: 'marcus@company.com',
      phone: '+1 555-0105',
      password: hash('password123'),
      plainDemoPassword: 'password123',
      role: 'employee',
      department: 'Design',
      designation: 'Lead Product & UI/UX Designer',
      joiningDate: '2023-08-01',
      salary: '$79,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    },
    {
      id: 'EMP-1006',
      name: 'Priya Sharma',
      email: 'priya@company.com',
      phone: '+1 555-0106',
      password: hash('password123'),
      plainDemoPassword: 'password123',
      role: 'employee',
      department: 'Marketing',
      designation: 'Digital Marketing Strategist',
      joiningDate: '2023-11-12',
      salary: '$74,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    },
    {
      id: 'EMP-1007',
      name: 'James Wilson',
      email: 'james@company.com',
      phone: '+1 555-0107',
      password: hash('password123'),
      plainDemoPassword: 'password123',
      role: 'employee',
      department: 'Sales',
      designation: 'Senior Account Executive',
      joiningDate: '2024-01-08',
      salary: '$78,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    },
    {
      id: 'EMP-1008',
      name: 'Aaliyah Patel',
      email: 'aaliyah@company.com',
      phone: '+1 555-0108',
      password: hash('password123'),
      plainDemoPassword: 'password123',
      role: 'employee',
      department: 'HR',
      designation: 'People & Culture Specialist',
      joiningDate: '2024-03-20',
      salary: '$71,000 / yr',
      avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
      status: 'active'
    }
  ];

  // Pre-seed today's attendance records
  // Elena: checked in 4h ago, active
  // Marcus: checked in 5h 30m ago, completed 30m break, active
  // Priya: on approved leave today
  // James: absent today
  // Alex: checked in 2h ago, active
  const attendance = [
    {
      id: `ATT-${todayStr}-EMP-1004`,
      employeeId: 'EMP-1004',
      employeeName: 'Elena Rostova',
      department: 'Engineering',
      date: todayStr,
      checkIn: createPastTimestamp(4, 15),
      checkOut: null,
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 1200, // 20 mins break
      workedSeconds: 13500, // ~3.75 hrs
      status: 'In Progress',
      note: 'Auto-clocked in upon login'
    },
    {
      id: `ATT-${todayStr}-EMP-1005`,
      employeeId: 'EMP-1005',
      employeeName: 'Marcus Chen',
      department: 'Design',
      date: todayStr,
      checkIn: createPastTimestamp(5, 45),
      checkOut: null,
      isOnBreak: true,
      breakStartTime: createPastTimestamp(0, 15),
      totalBreakSeconds: 1800, // 30 mins
      workedSeconds: 18900, // ~5.25 hrs
      status: 'In Progress',
      note: 'Auto-clocked in upon login (Currently on Lunch Break)'
    },
    {
      id: `ATT-${todayStr}-EMP-1002`,
      employeeId: 'EMP-1002',
      employeeName: 'David Miller',
      department: 'Engineering',
      date: todayStr,
      checkIn: createPastTimestamp(6, 10),
      checkOut: null,
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 2400, // 40 mins
      workedSeconds: 19800, // ~5.5 hrs
      status: 'In Progress',
      note: 'Auto-clocked in upon login'
    },
    // Past days for Alex Johnson (to showcase monthly attendance history)
    {
      id: `ATT-PAST-1-EMP-1003`,
      employeeId: 'EMP-1003',
      employeeName: 'Alex Johnson',
      department: 'Engineering',
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      checkIn: '09:02:15',
      checkOut: '17:42:10',
      totalBreakSeconds: 2700, // 45 min
      workedSeconds: 28800, // 8.00 hours
      status: 'Completed',
      note: 'Full 8 hours completed'
    },
    {
      id: `ATT-PAST-2-EMP-1003`,
      employeeId: 'EMP-1003',
      employeeName: 'Alex Johnson',
      department: 'Engineering',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      checkIn: '08:55:00',
      checkOut: '17:35:00',
      totalBreakSeconds: 3600, // 1 hr
      workedSeconds: 28800, // 8.00 hours
      status: 'Completed',
      note: 'Target met'
    },
    {
      id: `ATT-PAST-3-EMP-1003`,
      employeeId: 'EMP-1003',
      employeeName: 'Alex Johnson',
      department: 'Engineering',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      checkIn: '09:15:00',
      checkOut: '18:15:00',
      totalBreakSeconds: 3000, // 50 min
      workedSeconds: 29400, // 8.16 hours (Overtime)
      status: 'Completed',
      note: 'Overtime +10m'
    },
    {
      id: `ATT-PAST-4-EMP-1003`,
      employeeId: 'EMP-1003',
      employeeName: 'Alex Johnson',
      department: 'Engineering',
      date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      checkIn: '09:30:00',
      checkOut: '16:30:00',
      totalBreakSeconds: 3600,
      workedSeconds: 21600, // 6.0 hours
      status: 'Short Hours',
      note: 'Approved early leave for doctor appointment'
    }
  ];

  const leaves = [
    {
      id: 'LV-201',
      employeeId: 'EMP-1006',
      employeeName: 'Priya Sharma',
      department: 'Marketing',
      leaveType: 'Annual Leave',
      startDate: todayStr,
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      reason: 'Family event and travel',
      status: 'Approved',
      appliedAt: createPastTimestamp(48),
      reviewedBy: 'Sarah Connor',
      reviewNote: 'Enjoy your time off!'
    },
    {
      id: 'LV-202',
      employeeId: 'EMP-1004',
      employeeName: 'Elena Rostova',
      department: 'Engineering',
      leaveType: 'Casual Leave',
      startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      reason: 'Home utility maintenance & deliveries',
      status: 'Pending',
      appliedAt: createPastTimestamp(12),
      reviewedBy: null,
      reviewNote: null
    },
    {
      id: 'LV-203',
      employeeId: 'EMP-1007',
      employeeName: 'James Wilson',
      department: 'Sales',
      leaveType: 'Sick Leave',
      startDate: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
      reason: 'Seasonal flu',
      status: 'Approved',
      appliedAt: createPastTimestamp(200),
      reviewedBy: 'Sarah Connor',
      reviewNote: 'Get well soon'
    }
  ];

  const auditLogs = [
    {
      id: 'LOG-1',
      timestamp: createPastTimestamp(6, 10),
      user: 'David Miller',
      action: 'LOGIN',
      details: 'Logged in from Web App. Automatic 8h Attendance Check In initiated.'
    },
    {
      id: 'LOG-2',
      timestamp: createPastTimestamp(5, 45),
      user: 'Marcus Chen',
      action: 'LOGIN',
      details: 'Logged in from Mobile PWA. Automatic 8h Attendance Check In initiated.'
    },
    {
      id: 'LOG-3',
      timestamp: createPastTimestamp(4, 15),
      user: 'Elena Rostova',
      action: 'LOGIN',
      details: 'Logged in from Web App. Automatic 8h Attendance Check In initiated.'
    },
    {
      id: 'LOG-4',
      timestamp: createPastTimestamp(3, 30),
      user: 'Sarah Connor',
      action: 'LEAVE_APPROVAL',
      details: 'Approved Annual Leave request LV-201 for Priya Sharma.'
    }
  ];

  return {
    users,
    attendance,
    leaves,
    auditLogs
  };
}
