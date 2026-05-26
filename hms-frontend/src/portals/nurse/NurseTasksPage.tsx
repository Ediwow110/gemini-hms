import { PageHeader } from '../../components/ui/page-header';
import { logger } from '../../lib/logger';
import { NursingTaskBoard, NursingTask } from './components/NursingTaskBoard';
import { AlertTriangle } from 'lucide-react';

const mockTasks: NursingTask[] = [
  { id: 'T-01', patientName: 'Eleanor Vance', room: 'Triage Room 1', taskType: 'Initiate O2 supplementation @ 2L/min nasal cannula', urgency: 'stat', status: 'todo', time: '12:10 PM' },
  { id: 'T-02', patientName: 'Arthur Pendleton', room: 'Exam Room 3', taskType: 'Administer oral paracetamol 500mg', urgency: 'routine', status: 'todo', time: '12:25 PM' },
  { id: 'T-03', patientName: 'Victor Frankenstein', room: 'Observation Bed A', taskType: 'Collect venous blood sample for CBC & Electrolytes', urgency: 'urgent', status: 'in_progress', time: '12:00 PM' },
  { id: 'T-04', patientName: 'Elizabeth Lavenza', room: 'Wound Care Suite', taskType: 'Post-op surgical dressing renewal', urgency: 'routine', status: 'done', time: '11:15 AM' },
];

export const NurseTasksPage = () => {
  const handleTaskUpdate = (task: NursingTask) => {
    logger.info('Nursing task state updated:', task);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Nursing Task Board (WIP/Mock)</h5>
          <p className="font-medium mt-0.5">
            This board is currently running in demo mode with simulated tasks. There is no backend support for nursing task/checklist persistence at this time.
          </p>
        </div>
      </div>

      <PageHeader 
        title="Nursing Daily Worklist" 
        description="Monitor, organize, and complete operational nursing assignments and stat orders requested by physicians." 
      />

      <div className="max-w-6xl mx-auto">
        <NursingTaskBoard initialTasks={mockTasks} onTaskUpdate={handleTaskUpdate} isMock={true} />
      </div>
    </div>
  );
};

export default NurseTasksPage;
