import React from 'react';
import { LifeBuoy, User, Clock } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  userRole: string;
  tenantName: string;
  branchName: string;
  issueType: string;
  summary: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface UserSupportQueueProps {
  tickets: SupportTicket[];
}

export const UserSupportQueue: React.FC<UserSupportQueueProps> = ({ tickets }) => {
  const getIssueLabel = (type: string) => {
    switch (type) {
      case 'LOGIN_FAILURE': return 'Login Failure';
      case 'MFA_RESET': return 'MFA Reset';
      case 'SESSION_LOCKOUT': return 'Session Lockout';
      case 'PERMISSION_REQUEST': return 'Permission Request';
      case 'PASSWORD_RESET': return 'Password Reset';
      case 'ACCOUNT_UNLOCK': return 'Account Unlock';
      default: return type;
    }
  };

  const getIssueBadge = (type: string) => {
    switch (type) {
      case 'LOGIN_FAILURE':
      case 'SESSION_LOCKOUT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MFA_RESET':
      case 'ACCOUNT_UNLOCK':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PASSWORD_RESET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getPriorityType = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'danger';
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-indigo-500" />
            User Support Queue
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Active help-desk tickets for login, MFA, and account issues</p>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">{tickets.length} tickets</span>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <LifeBuoy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold">No open support tickets</p>
          <p className="text-[10px] font-medium mt-1">All user issues have been resolved</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{ticket.userName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{ticket.userEmail} · {ticket.userRole}</p>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-slate-400 font-bold">{ticket.id}</span>
              </div>

              <p className="text-xs text-slate-600 font-semibold mb-2">{ticket.summary}</p>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${getIssueBadge(ticket.issueType)}`}>
                  {getIssueLabel(ticket.issueType)}
                </span>
                <StatusBadge status={ticket.status.replace('_', ' ')} type={ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'OPEN' ? 'warning' : 'info'} />
                <StatusBadge status={ticket.priority} type={getPriorityType(ticket.priority)} />
              </div>

              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {ticket.createdAt}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  {ticket.tenantName} · {ticket.branchName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Shell Notice:</strong> Support queue items are simulated. No real account mutations, MFA resets, or session changes occur from this view.
      </div>
    </div>
  );
};

export default UserSupportQueue;
