import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import UserSupportQueue, { SupportTicket } from './components/UserSupportQueue';

export const UserSupportPage: React.FC = () => {
  const mockTickets: SupportTicket[] = [
    {
      id: 'TK-4201', userName: 'Dr. Sarah Chen', userEmail: 'sarah.chen@stjude.org', userRole: 'Doctor',
      tenantName: 'St. Jude Hospital Network', branchName: 'St. Jude Metro',
      issueType: 'LOGIN_FAILURE', summary: 'Unable to login after password change — locked after 5 failed attempts',
      status: 'OPEN', priority: 'HIGH', createdAt: '2026-05-21 13:20'
    },
    {
      id: 'TK-4202', userName: 'Nurse James Park', userEmail: 'james.park@mediclinics.org', userRole: 'Nurse',
      tenantName: 'MediClinics Group', branchName: 'MediClinics Central',
      issueType: 'MFA_RESET', summary: 'Lost authenticator device — requesting MFA re-enrollment',
      status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2026-05-21 11:45'
    },
    {
      id: 'TK-4203', userName: 'Admin Petra Lim', userEmail: 'petra.lim@apex.health', userRole: 'Branch Admin',
      tenantName: 'Apex Healthcare Services', branchName: 'Apex West',
      issueType: 'PERMISSION_REQUEST', summary: 'Requesting Inventory Manager permissions for seasonal procurement cycle',
      status: 'WAITING_USER', priority: 'LOW', createdAt: '2026-05-20 09:30'
    },
    {
      id: 'TK-4204', userName: 'Cashier Mia Santos', userEmail: 'mia.santos@stjude.org', userRole: 'Cashier',
      tenantName: 'St. Jude Hospital Network', branchName: 'St. Jude North',
      issueType: 'SESSION_LOCKOUT', summary: 'Session expired during active billing — all unsaved invoice data lost',
      status: 'OPEN', priority: 'URGENT', createdAt: '2026-05-21 14:02'
    },
    {
      id: 'TK-4205', userName: 'Lab Tech Ryan Ong', userEmail: 'ryan.ong@mediclinics.org', userRole: 'Lab Technician',
      tenantName: 'MediClinics Group', branchName: 'MediClinics Central',
      issueType: 'PASSWORD_RESET', summary: 'Password expired, unable to re-set via self-service portal',
      status: 'RESOLVED', priority: 'LOW', createdAt: '2026-05-19 16:10'
    },
    {
      id: 'TK-4206', userName: 'Dr. Anna Lee', userEmail: 'anna.lee@apex.health', userRole: 'Doctor',
      tenantName: 'Apex Healthcare Services', branchName: 'Apex West',
      issueType: 'ACCOUNT_UNLOCK', summary: 'Account locked after suspicious geo-location login detected',
      status: 'IN_PROGRESS', priority: 'HIGH', createdAt: '2026-05-21 10:05'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            User Support Center
          </h2>
          <p className="text-xs text-slate-500 font-medium">Login failures, MFA resets, account lockouts, and permission requests</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> Support tickets are simulated. No real account mutations or MFA resets occur from this view.
        </div>
      </div>

      <ITScopeFilter />

      <UserSupportQueue tickets={mockTickets} />
    </div>
  );
};

export default UserSupportPage;
