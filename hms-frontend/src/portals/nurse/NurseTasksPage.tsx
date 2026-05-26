import { useState, useCallback } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { NursingTaskBoard } from './components/NursingTaskBoard';
import { useNursingTasks } from '../../hooks/use-nursing-tasks';
import { Plus, X } from 'lucide-react';
import type { CreateNurseTaskPayload } from '../../services/nursing.service';

export const NurseTasksPage = () => {
  const {
    tasks,
    isLoading,
    error,
    startTask,
    completeTask,
    cancelTask,
    reopenTask,
    createTask,
  } = useNursingTasks();

  const [isPending, setIsPending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  });

  const handleStart = useCallback(async (id: string) => {
    setIsPending(true);
    try {
      await startTask(id);
    } finally {
      setIsPending(false);
    }
  }, [startTask]);

  const handleComplete = useCallback(async (id: string) => {
    setIsPending(true);
    try {
      await completeTask(id);
    } finally {
      setIsPending(false);
    }
  }, [completeTask]);

  const handleCancel = useCallback(async (id: string) => {
    setIsPending(true);
    try {
      await cancelTask(id);
    } finally {
      setIsPending(false);
    }
  }, [cancelTask]);

  const handleReopen = useCallback(async (id: string) => {
    setIsPending(true);
    try {
      await reopenTask(id);
    } finally {
      setIsPending(false);
    }
  }, [reopenTask]);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setIsPending(true);
    try {
      await createTask(createForm as CreateNurseTaskPayload);
      setCreateForm({ title: '', description: '', priority: 'MEDIUM' });
      setShowCreateModal(false);
    } finally {
      setIsPending(false);
    }
  }, [createForm, createTask]);

  const mappedTasks = tasks.map(t => ({
    id: t.id,
    patientName: t.patientName ?? null,
    patientMrn: t.patientMrn ?? null,
    title: t.title,
    description: t.description ?? null,
    priority: t.priority,
    status: t.status,
    assignedUserName: t.assignedUserName ?? null,
    createdAt: t.createdAt,
    dueAt: t.dueAt ?? null,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Nursing Daily Worklist"
          description="Monitor, organize, and complete operational nursing assignments and stat orders requested by physicians."
        />
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={isPending}
          className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      <NursingTaskBoard
        tasks={mappedTasks}
        isLoading={isLoading}
        error={error}
        onStart={handleStart}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onReopen={handleReopen}
        isPending={isPending}
      />

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase">
                Create Nursing Task
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Task Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Administer IV fluids"
                  className="input text-xs py-2 w-full rounded-xl bg-slate-50 border border-slate-200"
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional instructions or notes..."
                  className="input min-h-[80px] text-xs py-2 w-full rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm(f => ({ ...f, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }))}
                  className="input text-xs py-2 w-full rounded-xl bg-white border border-slate-200"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                disabled={isPending || !createForm.title.trim()}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NurseTasksPage;
