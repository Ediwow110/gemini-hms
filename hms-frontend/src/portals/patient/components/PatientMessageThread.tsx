import React from 'react';
import { Send, CheckCheck } from 'lucide-react';

export interface Message {
  id: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  isRead: boolean;
}

interface PatientMessageThreadProps {
  messages: Message[];
}

export const PatientMessageThread: React.FC<PatientMessageThreadProps> = ({ messages }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[500px]">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md">
            CH
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Care Team Chat</h3>
            <p className="text-[10px] text-emerald-600 font-bold">Online Support</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
              m.isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              {!m.isMe && <p className="text-[9px] font-black uppercase text-indigo-600 mb-1">{m.sender} · {m.role}</p>}
              <p className="text-xs font-medium leading-relaxed">{m.content}</p>
              <div className={`flex items-center gap-1.5 mt-1.5 ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-[8px] font-bold ${m.isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {m.timestamp}
                </span>
                {m.isMe && <CheckCheck className="h-3 w-3 text-indigo-200" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Type your message here..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[9px] text-amber-800 font-semibold text-center">
          <strong>Shell Notice:</strong> Messaging is simulated. No real care team notifications are sent.
        </div>
      </div>
    </div>
  );
};

export default PatientMessageThread;
