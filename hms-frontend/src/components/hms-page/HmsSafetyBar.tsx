interface HmsSafetyBarProps {
  patientName: string;
  mrn: string;
  dob?: string;
  age?: string | number;
  gender?: string;
  allergies?: string;
  insurance?: string;
  policyNo?: string;
}

export const HmsSafetyBar = ({
  patientName,
  mrn,
  dob,
  age,
  gender,
  allergies,
  insurance,
  policyNo,
}: HmsSafetyBarProps) => {
  const isAllergiesPresent = allergies && allergies.trim() !== '' && allergies.toLowerCase() !== 'none known' && allergies.toLowerCase() !== 'none';

  return (
    <div className="bg-slate-900 text-slate-100 px-4 py-2.5 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border border-slate-900">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-extrabold text-sm tracking-tight text-white font-sans">{patientName}</span>
          <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-500/20 uppercase tracking-wider font-mono">
            MRN: {mrn}
          </span>
          {insurance && (
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-700 uppercase tracking-wider font-sans">
              {insurance}{policyNo && policyNo !== 'N/A' ? ` (${policyNo})` : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 font-medium uppercase font-mono">
          {dob && (
            <span>
              DOB: <strong className="text-slate-200">{dob}</strong>
            </span>
          )}
          {dob && age !== undefined && <span>•</span>}
          {age !== undefined && (
            <span>
              AGE: <strong className="text-slate-200">{age}</strong>
            </span>
          )}
          {gender && <span>•</span>}
          {gender && (
            <span>
              GENDER: <strong className="text-slate-200">{gender}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <div
          className={`text-[10px] font-extrabold rounded-lg px-2.5 py-1 uppercase tracking-wider border select-none font-sans ${
            isAllergiesPresent
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          Allergies: {allergies || 'None Known'}
        </div>
      </div>
    </div>
  );
};

export default HmsSafetyBar;
