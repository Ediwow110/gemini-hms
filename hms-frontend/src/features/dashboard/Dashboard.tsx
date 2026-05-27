import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText,
  ChevronRight,
  PlusCircle,
  TrendingUp
} from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { MetricCard } from "../../components/ui/metric-card";
import { AlertCard } from "../../components/ui/alert-card";
import { useUser } from "../../hooks/use-user";

const STATUS_COLORS: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700",
  indigo: "bg-indigo-100 text-indigo-700",
  rose: "bg-rose-100 text-rose-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

const ACTIVITY_COLORS: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-50 text-slate-600",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const Dashboard = () => {
  const user = useUser();
  const navigate = useNavigate();
  const displayName = user?.email?.split('@')[0] || 'Staff';

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <PageHeader 
          title={`${getGreeting()}, ${displayName}`}
          description="Here's what's happening at your hospital today." 
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="animate-slide-up stagger-1">
          <MetricCard 
            title="Pending Lab Validation" 
            value={12}
            description="Requires immediate attention"
            icon={FileText}
            color="rose"
            trend={{ value: "2 from yesterday", isPositive: false }}
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <MetricCard 
            title="Active Queue" 
            value={24}
            description="Patients currently waiting"
            icon={Users}
            color="indigo"
            trend={{ value: "5% increase", isPositive: true }}
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <MetricCard 
            title="Low Stock Alerts" 
            value={5}
            description="Critical items below threshold"
            icon={AlertTriangle}
            color="amber"
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <MetricCard 
            title="Successful Visits" 
            value={148}
            description="Completed today"
            icon={CheckCircle2}
            color="emerald"
            trend={{ value: "12% increase", isPositive: true }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Operational Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Critical Alerts Section */}
          <section className="animate-fade-in stagger-3">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              Critical Alerts
              <span className="ml-auto text-xs font-medium text-slate-400">3 active</span>
            </h3>
            <div className="space-y-3">
              <AlertCard 
                title="Critical Lab Result"
                description="Patient ID #P-9021 has critical potassium level."
                icon={XCircle}
                severity="error"
                action={{ label: "View Result", onClick: () => {} }}
              />
              <AlertCard 
                title="Stock Depletion"
                description="Surgical gloves (Size M) are nearly out of stock."
                icon={AlertTriangle}
                severity="warning"
                action={{ label: "Order Now", onClick: () => {} }}
              />
              <AlertCard 
                title="System Update"
                description="Scheduled maintenance tonight at 11:00 PM."
                icon={Clock}
                severity="info"
              />
            </div>
          </section>

          {/* Today's Operations Section */}
          <section className="animate-fade-in stagger-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Activity className="h-4 w-4 text-indigo-500" />
                </div>
                Today's Operations
              </h3>
              <button onClick={() => navigate('/patients')} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-200">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm table-premium">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: "John Doe", initials: "JD", dept: "Emergency", status: "In Queue", time: "10:30 AM", color: "amber" },
                    { name: "Jane Smith", initials: "JS", dept: "Cardiology", status: "Consultation", time: "10:15 AM", color: "indigo" },
                    { name: "Robert Brown", initials: "RB", dept: "Laboratory", status: "Pending Result", time: "09:45 AM", color: "rose" },
                    { name: "Emily Davis", initials: "ED", dept: "Pharmacy", status: "Completed", time: "09:20 AM", color: "emerald" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:from-indigo-100 group-hover:to-violet-100 group-hover:text-indigo-700 transition-all duration-200">
                            {row.initials}
                          </div>
                          <span className="font-semibold text-slate-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{row.dept}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[row.color]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 text-xs font-medium">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar/Right Column Section */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <section className="animate-fade-in stagger-5">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-violet-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-violet-500" />
              </div>
              Recent Activity
            </h3>
            <div className="card p-5 space-y-5">
              {[
                { icon: CheckCircle2, text: "Lab result uploaded for #P-9021", time: "2m ago", color: "emerald" },
                { icon: PlusCircle, text: "New patient registered: Alice Lee", time: "15m ago", color: "indigo" },
                { icon: AlertTriangle, text: "Low stock warning: Gauze", time: "45m ago", color: "amber" },
                { icon: FileText, text: "Invoice generated: #INV-004", time: "1h ago", color: "slate" },
              ].map((activity, i) => (
                <div key={i} className="flex gap-3.5 group cursor-pointer">
                  <div className={`flex-shrink-0 h-9 w-9 rounded-xl ${ACTIVITY_COLORS[activity.color]} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 leading-snug font-medium group-hover:text-slate-900 transition-colors">{activity.text}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* System Status */}
          <section className="animate-fade-in stagger-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">System Status</h3>
            <div className="card p-5 space-y-4">
              {[
                { label: "API Server", status: "Online", color: "emerald", percent: 100 },
                { label: "Database", status: "Online", color: "emerald", percent: 100 },
                { label: "Storage", status: "85% Full", color: "amber", percent: 85 },
              ].map((sys, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <span className={`relative flex h-2 w-2`}>
                        {sys.color === "emerald" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${sys.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      </span>
                      {sys.label}
                    </div>
                    <span className={`text-xs font-semibold ${sys.color === "emerald" ? "text-emerald-600" : "text-amber-600"}`}>
                      {sys.status}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${sys.color === "emerald" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-500"}`}
                      style={{ width: `${sys.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
