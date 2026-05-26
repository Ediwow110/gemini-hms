import { ClipboardList, Play, CheckCircle2, RefreshCw, AlertCircle, Loader2, XCircle } from 'lucide-react';

export interface NursingTaskView {
  id: string;
  patientName: string | null;
  patientMrn: string | null;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedUserName: string | null;
  createdAt: string;
  dueAt: string | null;
}

interface NursingTaskBoardProps {
  tasks: NursingTaskView[];
  isLoading: boolean;
  error: string | null;
  onStart?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  onReopen?: (taskId: string) => void;
  isPending?: boolean;
}

export const NursingTaskBoard = ({
  tasks,
  isLoading,
  error,
  onStart,
  onComplete,
  onCancel,
  onReopen,
  isPending,
}: NursingTaskBoardProps) => {
  const openTasks = tasks.filter(t => t.status === 'OPEN');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED');

  if (error) {
    return (
      <div className="card p-8 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Unable to load nursing tasks</p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card p-8 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-500 mx-auto animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading tasks...</p>
      </div>
    );
  }

  const getUrgencyBadge = (priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => {
    const styles = {
      LOW: 'bg-slate-50 text-slate-600 border-slate-200',
      MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
      HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
      URGENT: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
    };
    return (
      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const renderColumn = (
    title: string,
    items: NursingTaskView[],
    themeColor: string,
    actions?: (task: NursingTaskView) => React.ReactNode,
  ) => (
    <div className="flex flex-col space-y-3.5 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex-1 min-w-[280px]">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${themeColor}`} />
          {title}
        </span>
        <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[400px] min-h-[250px] pr-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 select-none">
            <CheckCircle2 className="h-6 w-6 text-slate-300 mb-1" />
            <p className="text-[10px] font-semibold">No tasks in this list</p>
          </div>
        ) : (
          items.map(task => (
            <div
              key={task.id}
              className="bg-white border border-slate-200/85 p-3.5 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-2.5 relative group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h5 className="font-bold text-slate-800 text-xs truncate">
                    {task.patientName || 'Unassigned'}
                  </h5>
                  {task.patientMrn && (
                    <p className="text-[10px] text-slate-400 font-mono font-medium">{task.patientMrn}</p>
                  )}
                </div>
                {getUrgencyBadge(task.priority)}
              </div>

              <p className="text-[11px] text-slate-700 font-semibold bg-slate-50 border border-slate-100 p-2 rounded-xl">
                {task.title}
              </p>

              {task.description && (
                <p className="text-[10px] text-slate-500 italic line-clamp-2">{task.description}</p>
              )}

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
                {task.assignedUserName && <span>Assigned to: {task.assignedUserName}</span>}
                {task.dueAt && <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>}
              </div>

              {actions && (
                <div className="flex justify-end gap-1.5 border-t border-slate-50 pt-2">
                  {actions(task)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const hasUrgent = tasks.some(t => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status === 'OPEN');

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          Active Nursing Tasks Board
        </h3>
        {hasUrgent && (
          <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full animate-bounce">
            <AlertCircle className="h-3.5 w-3.5" />
            URGENT TASKS
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {renderColumn('Open', openTasks, 'bg-indigo-400', (task) => (
          <>
            {onStart && (
              <button
                onClick={() => onStart(task.id)}
                disabled={isPending}
                className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-3 w-3" /> Start
              </button>
            )}
            {onCancel && (
              <button
                onClick={() => onCancel(task.id)}
                disabled={isPending}
                className="text-[10px] font-extrabold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="h-3 w-3" /> Cancel
              </button>
            )}
          </>
        ))}

        {renderColumn('In Progress', inProgressTasks, 'bg-amber-400', (task) => (
          <>
            {onComplete && (
              <button
                onClick={() => onComplete(task.id)}
                disabled={isPending}
                className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-3 w-3" /> Complete
              </button>
            )}
            {onCancel && (
              <button
                onClick={() => onCancel(task.id)}
                disabled={isPending}
                className="text-[10px] font-extrabold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="h-3 w-3" /> Cancel
              </button>
            )}
          </>
        ))}

        {renderColumn('Completed', completedTasks, 'bg-emerald-400', (task) => (
          <>
            {onReopen && (
              <button
                onClick={() => onReopen(task.id)}
                disabled={isPending}
                className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-150 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-3 w-3" /> Reopen
              </button>
            )}
          </>
        ))}
      </div>
    </div>
  );
};

export default NursingTaskBoard;
