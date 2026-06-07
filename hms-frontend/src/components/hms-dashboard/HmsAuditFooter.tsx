interface HmsAuditFooterProps {
  lastRefreshed?: Date;
  dataSource?: string;
  version?: string;
}

export const HmsAuditFooter = ({ lastRefreshed, dataSource, version }: HmsAuditFooterProps) => (
  <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
      {lastRefreshed && (
        <span>
          Last refreshed:{' '}
          <span className="font-mono">{lastRefreshed.toLocaleTimeString()}</span>
        </span>
      )}
      {dataSource && <span>Source: {dataSource}</span>}
    </div>
    {version && (
      <span className="text-[11px] font-mono text-slate-300">{version}</span>
    )}
  </div>
);

export default HmsAuditFooter;
