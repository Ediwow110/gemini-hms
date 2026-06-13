import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import SessionActivityTable, { SessionEntry } from './components/SessionActivityTable';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const SessionsPage: React.FC = () => {
  const mockSessions: SessionEntry[] = [
    {
      id: 'SES-001', userId: 'USR-101', userName: 'Dr. Sarah Chen', userEmail: 'sarah.chen@stjude.org',
      userRole: 'Doctor', tenantName: 'St. Jude Hospital Network', branchName: 'St. Jude Metro',
      ipAddress: '192.168.1.45', userAgent: 'Chrome 126 / Windows 11',
      loginAt: '13:20 today', lastActivity: '2 min ago', riskLevel: 'LOW', isActive: true
    },
    {
      id: 'SES-002', userId: 'USR-102', userName: 'Nurse James Park', userEmail: 'james.park@mediclinics.org',
      userRole: 'Nurse', tenantName: 'MediClinics Group', branchName: 'MediClinics Central',
      ipAddress: '10.0.2.88', userAgent: 'Safari 18 / iPad OS 19',
      loginAt: '11:05 today', lastActivity: '15 min ago', riskLevel: 'LOW', isActive: true
    },
    {
      id: 'SES-003', userId: 'USR-103', userName: 'Unknown Admin', userEmail: 'admin@external-ip.net',
      userRole: 'System Admin', tenantName: 'St. Jude Hospital Network', branchName: 'St. Jude North',
      ipAddress: '198.51.100.42', userAgent: 'curl/7.88 (CLI)',
      loginAt: '09:12 today', lastActivity: '3 hrs ago', riskLevel: 'HIGH', isActive: true
    },
    {
      id: 'SES-004', userId: 'USR-104', userName: 'Cashier Mia Santos', userEmail: 'mia.santos@stjude.org',
      userRole: 'Cashier', tenantName: 'St. Jude Hospital Network', branchName: 'St. Jude Metro',
      ipAddress: '192.168.1.22', userAgent: 'Firefox 128 / Linux',
      loginAt: '14:00 today', lastActivity: '1 min ago', riskLevel: 'LOW', isActive: true
    },
    {
      id: 'SES-005', userId: 'USR-105', userName: 'Admin Petra Lim', userEmail: 'petra.lim@apex.health',
      userRole: 'Branch Admin', tenantName: 'Apex Healthcare Services', branchName: 'Apex West',
      ipAddress: '10.10.5.90', userAgent: 'Edge 126 / Windows 11',
      loginAt: '08:30 today', lastActivity: '45 min ago', riskLevel: 'MEDIUM', isActive: true
    },
    {
      id: 'SES-006', userId: 'USR-106', userName: 'Lab Tech Ryan Ong', userEmail: 'ryan.ong@mediclinics.org',
      userRole: 'Lab Technician', tenantName: 'MediClinics Group', branchName: 'MediClinics Central',
      ipAddress: '10.0.2.99', userAgent: 'Chrome 126 / macOS 15',
      loginAt: '12:45 today', lastActivity: '10 min ago', riskLevel: 'LOW', isActive: true
    }
  ];

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="Active User Sessions"
            description="Cross-tenant session monitoring, client analytics, and simulated revocation controls"
          />
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> Session data is simulated. Revoke actions affect UI only and do not terminate real sessions.
          </div>
        </div>

        <ITScopeFilter />

        <SessionActivityTable sessions={mockSessions} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default SessionsPage;
