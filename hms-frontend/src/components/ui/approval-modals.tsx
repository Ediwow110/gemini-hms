import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ModalProps { isOpen: boolean; title: string; warning?: string; onConfirm: () => void; onClose: () => void; children?: React.ReactNode; }

export const ConfirmationModal = ({ isOpen, title, warning, onConfirm, onClose, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <div className="text-sm text-slate-600 mb-4">{children}</div>
        {warning && (
          <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-xl text-xs text-amber-800 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary px-4 py-2">Cancel</button>
          <button onClick={onConfirm} className="btn btn-primary px-4 py-2">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export const ReasonModal = ({ isOpen, title, onConfirm, onClose, guidance, error }: { isOpen: boolean; title: string; onConfirm: (reason: string) => void; onClose: () => void; guidance: string; error?: string | null; }) => {
  const [reason, setReason] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{guidance}</p>
        <textarea
          className="w-full border border-slate-200 p-3 rounded-xl mb-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all resize-none"
          rows={4}
          placeholder="Enter your reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && (
          <p role="alert" className="mb-4 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary px-4 py-2">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={!reason} className="btn btn-danger px-4 py-2">Confirm</button>
        </div>
      </div>
    </div>
  );
};
