import React from 'react';
import PatientMessageThread, { Message } from './components/PatientMessageThread';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { Search } from 'lucide-react';

export const PatientMessagesPage: React.FC = () => {
  const mockMessages: Message[] = [
    { id: '1', sender: 'Care Team', role: 'Support', content: 'Hello! This is the Metro Central Hospital care team. How can we help you today?', timestamp: '09:00 AM', isMe: false, isRead: true },
    { id: '2', sender: 'Patient', role: 'You', content: 'Hi, I have a question about my laboratory results from yesterday.', timestamp: '09:15 AM', isMe: true, isRead: true },
    { id: '3', sender: 'Dr. House', role: 'Physician', content: 'I have reviewed your CBC. Everything looks normal. You can download the report from the Results tab.', timestamp: '10:30 AM', isMe: false, isRead: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Messages
          </h2>
          <p className="text-xs text-slate-500 font-medium">Securely communicate with your care team and hospital support</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Conversations</h4>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 cursor-pointer">
              <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm">
                CT
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">Care Team & Specialists</p>
                <p className="text-[10px] text-indigo-600 font-bold truncate">Dr. House: Everything looks normal...</p>
              </div>
              <div className="h-2 w-2 bg-indigo-600 rounded-full" />
            </div>
            <div className="p-3 hover:bg-slate-50 border border-transparent rounded-xl flex items-center gap-3 cursor-pointer transition-colors">
              <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-black text-xs">
                BS
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-700 truncate">Billing Support</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">No new messages</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <PatientMessageThread messages={mockMessages} />
        </div>
      </div>
    </div>
  );
};

export default PatientMessagesPage;
