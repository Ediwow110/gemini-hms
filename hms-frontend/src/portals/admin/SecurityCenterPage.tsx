import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { SecurityAlertPanel } from './components/SecurityAlertPanel';
import { 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Key, 
  Activity, 
  Ban,
  Clock,
  Fingerprint
} from 'lucide-react';

interface SecurityMetric {
  label: string;
  value: string;
  subtext: string;
  severity: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

interface SuspiciousAccessLog {
  timestamp: string;
  user: string;
  ip: string;
  location: string;
  flag: string;
}

interface MfaDisabledUser {
  name: string;
  email: string;
  role: string;
  lastLogin: string;
}

interface LockedAccount {
  name: string;
  email: string;
  role: string;
  reason: string;
  lockedAt: string;
}

interface PermissionChangeLog {
  timestamp: string;
  actor: string;
  roleModified: string;
  detail: string;
}

interface ActiveSession {
  id: string;
  user: string;
  role: string;
  ip: string;
  duration: string;
  status: 'ACTIVE' | 'IDLE';
}

export const SecurityCenterPage: React.FC = () => {
  const [activeMfaScan, setActiveMfaScan] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'users' | 'sessions' | 'policies'>('alerts');
  const [activeActionModal, setActiveActionModal] = useState<{ type: string; details?: string } | null>(null);

  const mockMetrics: SecurityMetric[] = [
    { label: "Failed Logins (24h)", value: "8 Attempts", subtext: "Average is 1.2 per day", severity: "WARNING" },
    { label: "Accounts Locked", value: "1 Account", subtext: "Brute force policy triggered", severity: "CRITICAL" },
    { label: "MFA Compliance Status", value: "98.2%", subtext: "6 users disabled MFA", severity: "WARNING" },
    { label: "Active User Sessions", value: "48 Sessions", subtext: "All verified IP boundaries", severity: "HEALTHY" }
  ];

  const mockAlerts = [
    {
      id: "AL-01",
      type: "FAILED_LOGIN" as const,
      title: "Multiple Failed Logins",
      description: "5 failed attempts on user 'admin@mediclinics.com' from IP 192.168.4.12",
      time: "10 mins ago",
      severity: "WARNING" as const
    },
    {
      id: "AL-02",
      type: "LOCKED_ACCOUNT" as const,
      title: "Account Locked Automatically",
      description: "User account 'dr.stein@hms.com' locked due to suspected brute force pattern.",
      time: "24 mins ago",
      severity: "CRITICAL" as const
    },
    {
      id: "AL-03",
      type: "SUSPICIOUS_ACCESS" as const,
      title: "Session Geography Anomaly",
      description: "User account 'cashier.cebu@hms.com' logged in from unexpected VPN subnet.",
      time: "1 hour ago",
      severity: "WARNING" as const
    }
  ];

  const suspiciousAccessLogs: SuspiciousAccessLog[] = [
    { timestamp: "2026-05-21 13:02:14", user: "dr.stein@hms.com", ip: "203.0.113.44", location: "Singapore (VPN)", flag: "Geography Anomaly" },
    { timestamp: "2026-05-21 12:45:50", user: "nurse.maria@hms.com", ip: "198.51.100.12", location: "Cebu City (IP Change)", flag: "Rapid Location Shift" },
    { timestamp: "2026-05-21 10:14:02", user: "admin@mediclinics.com", ip: "88.198.2.14", location: "Frankfurt (VPN)", flag: "Hosting Provider IP" }
  ];

  const mfaDisabledUsers: MfaDisabledUser[] = [
    { name: "Mark Santos", email: "mark@hms.com", role: "Cashier", lastLogin: "2026-05-21 11:20" },
    { name: "Jane Doe", email: "jane@hms.com", role: "Pharmacist", lastLogin: "2026-05-21 08:30" },
    { name: "MediClinics Registrar", email: "registrar@mediclinics.com", role: "Branch Admin", lastLogin: "2026-05-18 09:30" },
    { name: "Bob Smith", email: "bob@hms.com", role: "Lab Technician", lastLogin: "2026-05-17 14:15" },
    { name: "Alice Johnson", email: "alice@hms.com", role: "Nurse", lastLogin: "2026-05-16 11:00" },
    { name: "Tom Brown", email: "tom@hms.com", role: "Doctor", lastLogin: "2026-05-15 16:45" }
  ];

  const lockedAccounts: LockedAccount[] = [
    { name: "Dr. Arthur Stein", email: "arthur@hms.com", role: "Doctor", reason: "Brute force attack pattern (5 failed logins)", lockedAt: "2026-05-20 18:15" }
  ];

  const permissionChangeLogs: PermissionChangeLog[] = [
    { timestamp: "2026-05-21 13:12:04", actor: "Global Admin", roleModified: "Branch Admin", detail: "Added 'report.export' permission mapping" },
    { timestamp: "2026-05-20 09:45:12", actor: "System Monitor", roleModified: "Super Admin", detail: "Auto-enforced 'MFA Required' flag on global role" },
    { timestamp: "2026-05-19 14:22:30", actor: "Global Admin", roleModified: "Doctor", detail: "Revoked 'billing.invoice.view' permission mapping" }
  ];

  const activeSessions: ActiveSession[] = [
    { id: "SESS-901", user: "admin@hms.com", role: "Super Admin", ip: "192.168.1.1", duration: "12m", status: "ACTIVE" },
    { id: "SESS-902", user: "dr.sarah@hms.com", role: "Doctor", ip: "192.168.4.15", duration: "1h 45m", status: "ACTIVE" },
    { id: "SESS-903", user: "nurse.maria@hms.com", role: "Nurse", ip: "192.168.4.20", duration: "3h 12m", status: "IDLE" },
    { id: "SESS-904", user: "cashier.mark@hms.com", role: "Cashier", ip: "192.168.4.33", duration: "42m", status: "ACTIVE" }
  ];

  const failedLoginTrends = [
    { date: "May 15", count: 2 },
    { date: "May 16", count: 0 },
    { date: "May 17", count: 1 },
    { date: "May 18", count: 5 },
    { date: "May 19", count: 1 },
    { date: "May 20", count: 8 },
    { date: "May 21", count: 3 }
  ];

  const handleMfaScan = () => {
    setActiveMfaScan(true);
    setTimeout(() => {
      setActiveMfaScan(false);
    }, 2000);
  };

  const handleSecurityAction = (actionKey: string, details?: string) => {
    setActiveActionModal({ type: actionKey, details });
  };

  const getMetricStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-rose-150 bg-rose-50/30 text-rose-800';
      case 'WARNING':
        return 'border-amber-150 bg-amber-50/30 text-amber-800';
      default:
        return 'border-emerald-150 bg-emerald-50/30 text-emerald-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Security Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This module displays security monitoring streams in-memory. Threat logs, account lockouts, active sessions, and compliance policies are mock representations. No active firewall rules or intrusion prevention systems are initialized.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <PageHeader 
          title="Security Center Console" 
          description="Global monitoring of threat indicators, failed credentials, and session telemetry." 
        />
        <button 
          onClick={handleMfaScan}
          disabled={activeMfaScan}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit disabled:opacity-55 cursor-pointer"
        >
          {activeMfaScan ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Scanning MFA compliance...
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4" /> Trigger Compliance Scan
            </>
          )}
        </button>
      </div>

      {/* Grid: KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockMetrics.map((m, i) => (
          <div key={i} className={`card p-4 border shadow-sm rounded-2xl ${getMetricStyle(m.severity)}`}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{m.label}</p>
            <p className="text-xl font-black text-slate-800">{m.value}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">{m.subtext}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs for Security Dashboard */}
      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Alerts & Incidents ({mockAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          MFA & Locks ({mfaDisabledUsers.length + lockedAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Sessions ({activeSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'policies'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trends, Logs & Policies
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area based on Active Tab */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: ALERTS & INCIDENTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <SecurityAlertPanel alerts={mockAlerts} />

              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
                  VPN & Anomaly Traffic Logs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">User</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Location Context</th>
                        <th className="p-3">Risk Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {suspiciousAccessLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-400">{log.timestamp}</td>
                          <td className="p-3 font-bold text-slate-800">{log.user}</td>
                          <td className="p-3 font-mono text-slate-500">{log.ip}</td>
                          <td className="p-3">{log.location}</td>
                          <td className="p-3">
                            <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              {log.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MFA & LOCKS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {/* Locked Accounts Panel */}
              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5 text-rose-500" />
                    Locked Personnel Accounts
                  </h3>
                  <span className="bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-black px-2 py-0.5 rounded-md">
                    {lockedAccounts.length} Blocked
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase">
                        <th className="p-3">Account User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Lock Reason</th>
                        <th className="p-3">Locked At</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {lockedAccounts.map((account, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{account.name}</p>
                            <p className="text-[10px] text-slate-400">{account.email}</p>
                          </td>
                          <td className="p-3">{account.role}</td>
                          <td className="p-3 text-slate-500">{account.reason}</td>
                          <td className="p-3 font-mono text-slate-400">{account.lockedAt}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleSecurityAction("UNLOCK_ACCOUNT", account.email)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Unlock Account
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MFA Compliance Panel */}
              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
                    <Key className="h-4.5 w-4.5 text-amber-500" />
                    MFA Disabled Personnel
                  </h3>
                  <span className="bg-amber-50 text-amber-700 border border-amber-150 text-[10px] font-black px-2 py-0.5 rounded-md">
                    {mfaDisabledUsers.length} Non-Compliant
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase">
                        <th className="p-3">Personnel</th>
                        <th className="p-3">App Role</th>
                        <th className="p-3">Last Active Login</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {mfaDisabledUsers.map((user, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{user.name}</p>
                            <p className="text-[10px] text-slate-400">{user.email}</p>
                          </td>
                          <td className="p-3">{user.role}</td>
                          <td className="p-3 font-mono text-slate-450">{user.lastLogin}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleSecurityAction("ENFORCE_MFA", user.email)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-250 text-indigo-700 font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Require MFA
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              
              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-500" />
                  Active User Sessions
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase">
                        <th className="p-3">Session User</th>
                        <th className="p-3">System Role</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Session Age</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {activeSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{session.user}</td>
                          <td className="p-3">{session.role}</td>
                          <td className="p-3 font-mono text-slate-500">{session.ip}</td>
                          <td className="p-3 font-mono text-slate-400">{session.duration}</td>
                          <td className="p-3">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              session.status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleSecurityAction("REVOKE_SESSION", session.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-700 font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Terminate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security Action Shell */}
              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
                  System-Wide Security Action Shell
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Trigger global containment procedures, lockouts, or rotation requests within this local testing sandbox.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSecurityAction("TERMINATE_ALL_SESSIONS", "All Active Logins")}
                    className="flex flex-col items-center justify-center p-4 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 hover:border-rose-350 text-rose-700 rounded-xl cursor-pointer transition-all"
                  >
                    <Ban className="h-5 w-5 mb-1.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Terminate All Sessions</span>
                  </button>

                  <button
                    onClick={() => handleSecurityAction("LOCK_NON_MFA_ACCOUNTS", "All users without 2FA Enabled")}
                    className="flex flex-col items-center justify-center p-4 border border-amber-200 bg-amber-50/20 hover:bg-amber-50 hover:border-amber-350 text-amber-700 rounded-xl cursor-pointer transition-all"
                  >
                    <Lock className="h-5 w-5 mb-1.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Lock Non-MFA Users</span>
                  </button>

                  <button
                    onClick={() => handleSecurityAction("FORCE_PASSWORD_ROTATION", "All Personnel Accounts")}
                    className="flex flex-col items-center justify-center p-4 border border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-350 text-indigo-700 rounded-xl cursor-pointer transition-all"
                  >
                    <RefreshCw className="h-5 w-5 mb-1.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Force Password Rotation</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TRENDS & POLICIES */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              
              {/* Failed Login Trends Chart */}
              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-500" />
                  Failed Login Trends (Last 7 Days)
                </h3>
                
                <div className="h-40 flex items-end gap-5 pt-6 pb-2 px-4 border-b border-slate-150">
                  {failedLoginTrends.map((trend, idx) => {
                    const maxVal = 8;
                    const heightPercent = trend.count > 0 ? (trend.count / maxVal) * 100 : 3;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[10px] font-bold text-slate-500">{trend.count}</span>
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            trend.count > 4 
                              ? 'bg-rose-500 shadow-sm shadow-rose-200' 
                              : trend.count > 0 
                              ? 'bg-indigo-500 shadow-sm shadow-indigo-200' 
                              : 'bg-slate-200'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] font-bold text-slate-400 mt-1 whitespace-nowrap">{trend.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permission Changes Log */}
              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Fingerprint className="h-4.5 w-4.5 text-indigo-500" />
                  Role & Permission Change Logs
                </h3>

                <div className="space-y-3">
                  {permissionChangeLogs.map((log, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 text-xs leading-relaxed">
                      <Clock className="h-4.5 w-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">{log.detail}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Actor: {log.actor} | Target Role: {log.roleModified} | Time: {log.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Key policies checklist */}
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
              Active Policies
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-600">Password Complexity</span>
                <span className="text-emerald-700 font-extrabold">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-600">Automatic Account Lockout</span>
                <span className="text-emerald-700 font-extrabold">5 FAILED LOGINS</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-600">Session Max Lifetime</span>
                <span className="text-slate-700 font-extrabold">12 HOURS</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-600">IP Boundary Scopes</span>
                <span className="text-slate-500 font-bold">MUTED</span>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-3 leading-relaxed">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-slate-500" />
              Incidents Resolution Scope
            </h4>
            <p className="text-slate-500 font-medium">
              Lockout incidents or suspicious geographic indicators should trigger account locks. Use the user directory controls to lock or suspend operations temporarily.
            </p>
            <p className="text-[10px] text-slate-400 font-semibold italic border-t border-slate-200 pt-2.5">
              Disclaimer: Compliance monitors in sandbox shells do not constitute formal security audits.
            </p>
          </div>
        </div>
      </div>

      {/* Security Action Modal Dialog */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl h-fit border border-amber-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Simulated Action
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mock governance sandbox execution</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p>
                Requested Action: <strong className="text-slate-800 uppercase font-mono">{activeActionModal.type}</strong>
              </p>
              {activeActionModal.details && (
                <p>
                  Target Scope: <strong>{activeActionModal.details}</strong>
                </p>
              )}
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                This is a UI demo shell only. Global security variables, session terminations, lockouts, and compliance scans are simulated in sandbox memory. No operational updates are committed to the HMS backend API.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => setActiveActionModal(null)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SecurityCenterPage;
