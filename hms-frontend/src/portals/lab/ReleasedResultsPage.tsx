import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { useReleasedResults } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Loader2,
  Clock,
  User,
  FlaskConical,
  SearchX,
} from 'lucide-react';
import axios from 'axios';

export const ReleasedResultsPage = () => {
  const navigate = useNavigate();
  const { data: results, isLoading, error } = useReleasedResults();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Released Results"
          description="Loading released results queue..."
        />
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <Loader2 className="h-10 w-10 text-indigo-500 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading released results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isForbidden =
      axios.isAxiosError(error) &&
      (error.response?.status === 403 || error.response?.status === 401);
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Released Results"
          description="Error loading released results"
        />
        <div className="card p-12 bg-white border border-rose-100 shadow-sm rounded-2xl text-center">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {isForbidden ? 'Access Restricted' : 'Connection Error'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isForbidden
              ? 'You do not have permission to view released results.'
              : 'Failed to load released results. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = !results || results.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Released Results"
        description="Results that have been approved and released for clinical visibility."
      />

      {isEmpty ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <SearchX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">
            No Released Results
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            No results have been released yet. Release validated results from the
            Pending Release queue.
          </p>
          <button
            onClick={() => navigate('/lab/validated')}
            className="mt-6 btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl"
          >
            Go to Pending Release
          </button>
        </div>
      ) : (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/60 text-slate-400 font-extrabold uppercase border-b border-slate-150">
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">MRN</th>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Panel</th>
                  <th className="px-6 py-3.5">Specimen</th>
                  <th className="px-6 py-3.5">Released</th>
                  <th className="px-6 py-3.5">Released By</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((result) => (
                  <tr
                    key={result.id}
                    className="hover:bg-slate-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/lab/released/${result.patientId}/${result.orderId}`)}
                  >
                    <td className="px-6 py-4 font-black text-slate-800">
                      {result.patientName}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-[10px]">
                      {result.patientNumber}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 font-semibold text-[10px]">
                      {result.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {result.panelName || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <FlaskConical className="h-3.5 w-3.5" />
                        <span className="font-semibold text-[10px]">
                          {result.specimenType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium text-[10px]">
                          {format(new Date(result.releasedAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-medium text-[10px]">
                          {result.releasedById
                            ? result.releasedById.slice(0, 8)
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-150">
                        Released
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card p-5 bg-amber-50 border border-amber-150 rounded-2xl text-xs text-amber-800 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="font-medium">
          <p>
            These results have been <strong>released</strong> for clinical visibility.
            Released results are viewable by authorized staff and (where applicable)
            to patients through the patient portal. Notification, billing integration,
            and further amendment workflows are not available in this phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReleasedResultsPage;
