import { useState, useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { labService } from '../../services/lab.service';
import { logger } from '../../lib/logger';

interface LegacyResultRedirectBridgeProps {
  mode: 'encode' | 'approval' | 'print-preview';
}

export const LegacyResultRedirectBridge = ({ mode }: LegacyResultRedirectBridgeProps) => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{
    patientId: string;
    orderId: string;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid result ID parameter');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    labService.getResult(id)
      .then((data) => {
        if (!active) return;
        
        // Safely extract patientId and orderId with robust fallbacks
        const patientId = data.order?.patientId || data.order?.patient?.id || data.patientId;
        const orderId = data.orderId || data.order?.id;

        if (!patientId || !orderId) {
          logger.error('Failed to resolve redirect parameters from legacy result payload', { data });
          setError('This legacy result record does not contain the necessary patient or order links required for the new lab portal.');
          setLoading(false);
          return;
        }

        setResolvedParams({ patientId, orderId });
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        logger.error('Failed to retrieve legacy result for redirect mapping', err);
        setError('The requested lab result could not be found or you lack permission to access it.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-semibold">
          Resolving legacy result parameter mapping...
        </p>
      </div>
    );
  }

  if (error || !resolvedParams) {
    return (
      <div className="p-8 max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-xl border border-slate-100 text-center space-y-4">
        <div className="inline-flex p-3 bg-rose-50 rounded-full text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Redirect Failed</h2>
        <p className="text-sm text-slate-500">
          {error || 'Unable to resolve destination parameters.'}
        </p>
        <div className="pt-2">
          <a
            href="/lab/orders"
            className="btn btn-secondary inline-block px-6 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Go to Lab Portal Queue
          </a>
        </div>
      </div>
    );
  }

  const { patientId, orderId } = resolvedParams;

  switch (mode) {
    case 'encode':
      return <Navigate to={`/lab/encoding?patientId=${patientId}&orderId=${orderId}`} replace state={{ from: location }} />;
    case 'approval':
      return <Navigate to={`/lab/validation?patientId=${patientId}&orderId=${orderId}`} replace state={{ from: location }} />;
    case 'print-preview':
      return <Navigate to={`/lab/released/${patientId}/${orderId}`} replace state={{ from: location }} />;
    default:
      return <Navigate to="/lab/orders" replace />;
  }
};
