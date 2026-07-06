import React from 'react';
import { ChevronRight, Filter } from 'lucide-react';
import { useUser } from '../../hooks/use-user';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import { useFieldServiceTechnicianSchedule } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const TechnicianSchedulePage: React.FC = () => {
  const user = useUser();
  const { data: schedule, isLoading } = useFieldServiceTechnicianSchedule();
  const isAdmin = !!user && (user.roles.includes("Super Admin") || user.roles.includes("Branch Admin"));

  return (
    <HmsDashboardShell>
      <div className="space-y-6">
        <HmsPageHeader
          title="My Schedule"
          description={isAdmin ? "Field Force Scheduling Overview" : "Daily job queue and route optimization"}
          badge={isAdmin ? "Admin" : "Sandbox"}
          actions={
            !isAdmin && (
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600">
                <Filter className="h-4 w-4" /> Filter View
              </button>
            )
          }
        />

        <FieldServiceShellNotice />

        {isLoading ? (
          <HmsLoadingSkeleton variant="panel" rows={3} />
        ) : isAdmin ? (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Technician</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Daily Load</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Utilization</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { tech: 'Alice Smith', load: '6 Jobs', util: '92%', status: 'On Route' },
                  { tech: 'Bob Jones', load: '4 Jobs', util: '65%', status: 'On Route' },
                  { tech: 'Charlie Brown', load: '7 Jobs', util: '105%', status: 'Delayed' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{row.tech}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.load}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.util}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${row.status === 'On Route' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !schedule || schedule.length === 0 ? (
          <HmsEmptyState title="No schedule" description="No schedule data available." />
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {schedule.map((day, i) => (
                <button key={day.day} className={`flex flex-col items-center gap-1 p-4 rounded-[1.5rem] min-w-[80px] transition-all ${
                  i === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-100 text-slate-400 hover:border-indigo-200'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-tight">{day.day.split(' ')[0]}</span>
                  <span className="text-lg font-black">{day.day.split(' ')[1]}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {schedule.flatMap((day) =>
                day.jobs.map((job) => (
                  <div key={job.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group cursor-pointer">
                      <div className="flex items-center gap-6">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs font-black text-slate-800">{job.time}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-100 hidden md:block" />
                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Job #{job.id}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Visit &middot; {job.duration}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-700">{job.customer}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{job.location}</p>
                        </div>
                        <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};


export default TechnicianSchedulePage;
