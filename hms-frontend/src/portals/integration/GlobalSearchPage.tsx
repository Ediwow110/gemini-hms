import React, { useState, useEffect } from 'react';
import { Search, Users, Package, FileText, DollarSign, ShoppingCart } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import GlobalSearchBox from './components/GlobalSearchBox';
import SearchResultCard from './components/SearchResultCard';
import { useIntegrationGlobalSearch } from '../../hooks/use-integration';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const GlobalSearchPage: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: searchResults, isLoading, error } = useIntegrationGlobalSearch(debouncedQuery);

  const filtered = (searchResults || []).filter(r => filterType ? r.recordType === filterType : true);
  return (
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Global Search"
          description="Cross-portal search with role-aware result filtering"
        />

        <IntegrationShellNotice />

        <GlobalSearchBox query={query} setQuery={setQuery} filterType={filterType} setFilterType={setFilterType} />

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <Search className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">Access-Limited Results Notice</p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Search results are limited to your role permissions. Patient users cannot see internal staff notes, unreleased lab results, or audit logs. Supplier users cannot see other supplier data or buyer private data. No real backend search indexing is performed in this phase.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Searches (Mock)</h3>
          <div className="flex flex-wrap gap-2">
            {['Patient: Juan Dela Cruz', 'Order: ORD-2026-9918', 'Lab Result: LAB-311', 'Supplier: Global Med'].map((s) => (
              <span key={s} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors">{s}</span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Result Cards</h3>
          
          {isLoading && debouncedQuery ? (
            <HmsLoadingSkeleton />
          ) : error ? (
            <div className="p-10 text-center text-sm font-bold text-rose-500">
              {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
                ? 'Unauthorized to perform global search.' 
                : 'Failed to execute search.'}
            </div>
          ) : debouncedQuery && filtered.length === 0 ? (
            <HmsEmptyState title="No results found" description={`No results found for "${debouncedQuery}".`} />
          ) : !debouncedQuery ? (
            <HmsEmptyState title="Type to search" description="Type above to search across domains..." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map(r => (
                <SearchResultCard
                  key={r.id}
                  title={r.title}
                  subtitle={`${r.id} · ${r.summary}`}
                  type={r.recordType}
                  portal={r.sourceDomain}
                  icon={r.recordType === 'PATIENT' ? Users : r.recordType === 'ORDER' ? ShoppingCart : r.recordType === 'LAB' ? FileText : r.recordType === 'BILLING' ? DollarSign : Package}
                  isMock={r.isMock}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default GlobalSearchPage;
