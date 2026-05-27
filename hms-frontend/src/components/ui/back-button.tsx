import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  fallback: string;
  preserveSearch?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const BackButton = ({
  label = 'Back',
  fallback,
  preserveSearch = false,
  className = '',
  ariaLabel,
}: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // 1. Check for returnTo query param
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('returnTo');

    if (returnTo) {
      navigate(returnTo);
      return;
    }

    // 2. Check if we can preserve search query on fallback
    if (preserveSearch) {
      navigate(`${fallback}${location.search}`);
      return;
    }

    // 3. Fallback to default
    navigate(fallback);
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all duration-200 border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer min-h-[44px] ${className}`}
      aria-label={ariaLabel ?? `Go back to ${label}`}
      title={ariaLabel ?? `Go back to ${label}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};
