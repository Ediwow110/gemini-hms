import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex mb-2 ${className}`}>
      <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center space-x-2">
            {idx > 0 && <span className="text-[10px] text-slate-300">/</span>}
            {item.to && !item.current ? (
              <Link
                to={item.to}
                className="hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-slate-500 font-bold"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
