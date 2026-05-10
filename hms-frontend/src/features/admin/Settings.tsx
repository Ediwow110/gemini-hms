import { PageHeader } from "../../components/ui/page-header";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { Save } from "lucide-react";

export const Settings = () => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="System Settings" description="Configure global system parameters, branches, and security rules." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {["General Information", "Branch Setup", "Security & Privacy", "Notifications", "Backup & Recovery"].map((tab, i) => (
            <button
              key={tab}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                i === 0 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <SectionCard title="General Information">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Hospital/Clinic Name" required>
                  <input className="input" defaultValue="HMS Core Medical Center" />
                </FormField>
                <FormField label="System Timezone" required>
                  <select className="input">
                    <option>Asia/Manila (GMT+8)</option>
                    <option>UTC</option>
                  </select>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Main Address">
                    <textarea className="input min-h-[80px] py-3" defaultValue="123 Health Ave, Medical City" />
                  </FormField>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Audit & Security Policies">
            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">Force Maker-Checker Approvals</p>
                  <p className="text-xs text-slate-500 mt-0.5">Require dual-authorization for all financial voids and result amendments.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">Strict Audit Logging</p>
                  <p className="text-xs text-slate-500 mt-0.5">Log every view, export, and download action (high storage usage).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-end pt-4">
            <button className="btn btn-primary flex items-center gap-2 px-6 py-2.5">
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
