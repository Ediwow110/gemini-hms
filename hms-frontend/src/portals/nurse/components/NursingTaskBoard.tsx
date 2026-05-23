import { useState } from 'react';
import { ClipboardList, Play, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export interface NursingTask {
  id: string;
  patientName: string;
  room: string;
  taskType: string;
  urgency: 'routine' | 'stat' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  time: string;
}

interface NursingTaskBoardProps {
  initialTasks: NursingTask[];
  onTaskUpdate?: (task: NursingTask) => void;
}

export const NursingTaskBoard = ({ initialTasks, onTaskUpdate }: NursingTaskBoardProps) => {
  const [tasks, setTasks] = useState<NursingTask[]>(initialTasks);

  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const updated = tasks.map(task => {
      if (task.id === taskId) {
        const nextTask = { ...task, status: newStatus };
        onTaskUpdate?.(nextTask);
        return nextTask;
      }
      return task;
    });
    setTasks(updated);
  };

  const getUrgencyBadge = (urgency: 'routine' | 'stat' | 'urgent') => {
    const styles = {
      routine: 'bg-slate-50 text-slate-600 border-slate-200',
      urgent: 'bg-amber-50 text-amber-700 border-amber-200',
      stat: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
    };
    return (
      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${styles[urgency]}`}>
        {urgency}
      </span>
    );
  };

  const renderColumn = (title: string, status: 'todo' | 'in_progress' | 'done', themeColor: string) => {
    const filtered = tasks.filter(t => t.status === status);

    return (
      <div className="flex flex-col space-y-3.5 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex-1 min-w-[280px]">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${themeColor}`} />
            {title}
          </span>
          <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>

        <div className="space-y-2.5 overflow-y-auto max-h-[400px] min-h-[250px] pr-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 select-none">
              <CheckCircle2 className="h-6 w-6 text-slate-300 mb-1" />
              <p className="text-[10px] font-semibold">No tasks in this list</p>
            </div>
          ) : (
            filtered.map(task => (
              <div 
                key={task.id} 
                className="bg-white border border-slate-200/85 p-3.5 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-2.5 relative group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{task.patientName}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Room {task.room} • {task.time}</p>
                  </div>
                  {getUrgencyBadge(task.urgency)}
                </div>

                <p className="text-[11px] text-slate-700 font-semibold bg-slate-50 border border-slate-100 p-2 rounded-xl">
                  {task.taskType}
                </p>

                {/* Transition Action Buttons */}
                <div className="flex justify-end gap-1.5 border-t border-slate-50 pt-2">
                  {status === 'todo' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                      className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1 transition-colors"
                    >
                      <Play className="h-3 w-3" /> Start
                    </button>
                  )}
                  {status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(task.id, 'todo')}
                        className="text-[10px] font-extrabold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" /> Revert
                      </button>
                      <button
                        onClick={() => handleStatusChange(task.id, 'done')}
                        className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Complete
                      </button>
                    </>
                  )}
                  {status === 'done' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-150 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" /> Redo
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          Active Nursing Tasks Board
        </h3>
        {tasks.some(t => t.urgency === 'stat' && t.status !== 'done') && (
          <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full animate-bounce">
            <AlertCircle className="h-3.5 w-3.5" />
            CRITICAL STAT REQUEST
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {renderColumn('To Do', 'todo', 'bg-indigo-400')}
        {renderColumn('In Progress', 'in_progress', 'bg-amber-400')}
        {renderColumn('Done', 'done', 'bg-emerald-400')}
      </div>
    </div>
  );
};

export default NursingTaskBoard;
