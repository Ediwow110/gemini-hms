interface HmsDataUnavailableProps {
  sectionName: string;
  expectedApi?: string;
  expectedPhase?: string;
}

export const HmsDataUnavailable = ({ sectionName, expectedApi, expectedPhase }: HmsDataUnavailableProps) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-center">
    <p className="text-[13px] font-semibold text-slate-400">
      🔒 {sectionName} — data not available yet.
    </p>
    {expectedApi && (
      <p className="mt-1 text-[11px] font-mono text-slate-400">
        Expected endpoint: <span className="font-medium">{expectedApi}</span>
      </p>
    )}
    {expectedPhase && (
      <p className="mt-0.5 text-[11px] text-slate-400">
        Target: <span className="font-medium">{expectedPhase}</span>
      </p>
    )}
  </div>
);

export default HmsDataUnavailable;
