import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  CreditCard, 
  ClipboardCheck, 
  ShieldCheck, 
  Package, 
  BarChart3, 
  ListOrdered, 
  FlaskConical, 
  Search, 
  Bell, 
  ChevronDown,
  Briefcase,
  Stethoscope,
  ClipboardList,
  Menu,
  X,
  LogOut,
  Settings as SettingsIcon,
  CheckSquare,
  Pill
} from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    label: 'Dashboard & Core',
    items: [
      { label: 'Command Center', to: '/', icon: LayoutDashboard },
      { label: 'Patient Management', to: '/patients', icon: Users },
      { label: 'Appointment & Queue', to: '/queue', icon: ListOrdered },
    ]
  },
  {
    label: 'Clinical Modules',
    items: [
      { label: 'EMR / Records', to: '/emr', icon: ClipboardList },
      { label: 'Laboratory / LIS', to: '/lab/results', icon: FlaskConical },
      { label: 'Radiology', to: '/radiology', icon: CheckSquare },
      { label: 'Pharmacy', to: '/pharmacy', icon: Pill },
    ]
  },
  {
    label: 'Finance & Supply',
    items: [
      { label: 'Billing & Cashier', to: '/billing', icon: CreditCard },
      { label: 'Inventory & Procurement', to: '/inventory', icon: Package },
      { label: 'Products & Services', to: '/orders/new', icon: PlusCircle },
    ]
  },
  {
    label: 'Administration & Security',
    items: [
      { label: 'Approvals', to: '/approvals', icon: ClipboardCheck },
      { label: 'Users & Roles', to: '/admin/users', icon: Users },
      { label: 'HR Management', to: '/hr', icon: Briefcase },
      { label: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
      { label: 'Notifications', to: '/notifications', icon: Bell },
      { label: 'Security & Audit Logs', to: '/audit-logs', icon: ShieldCheck },
      { label: 'System Settings', to: '/settings', icon: SettingsIcon },
    ]
  }
];

import { useUser, useAuth } from '../hooks/use-user';

function SidebarContent({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  const isActive = (path: string) => pathname === path;
  const user = useUser();
  const { logout } = useAuth();

  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigation.map((group) => (
          <div key={group.label}>
            <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
                      active
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full" />
                    )}
                    <Icon className={`h-[18px] w-[18px] transition-colors duration-200 ${
                      active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-slate-100">
        <div 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 hover:from-slate-100 hover:to-slate-100 transition-all duration-200 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-200 uppercase">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.roles?.[0]}</p>
          </div>
          <LogOut className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </>
  );
}

export const AppShell = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const user = useUser();

  return (
    <div className="min-h-screen flex bg-[#f0f2f7]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] bg-white border-r border-slate-200/80 flex-col sticky top-0 h-screen overflow-hidden shadow-sm">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100">
          <div className="gradient-primary p-2 rounded-xl shadow-md shadow-indigo-200/50">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HMS Core</span>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Healthcare Platform</p>
          </div>
        </div>
        <SidebarContent pathname={location.pathname} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="gradient-primary p-2 rounded-xl">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HMS Core</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <SidebarContent pathname={location.pathname} onNavClick={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 topbar-glass flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Search */}
            <div className={`relative hidden md:block transition-all duration-300 ease-out ${searchFocused ? 'max-w-lg' : 'max-w-sm'} w-full`}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, orders, or staff..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Quick Create */}
            <Link to="/orders/new" className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              <PlusCircle className="h-4 w-4" />
              <span>Quick Create</span>
            </Link>

            {/* Branch selector */}
            <button className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-xs">Branch: {user?.branchId || 'None'}</span>
            </button>
            
            {/* Notifications */}
            <Link to="/notifications" className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:text-slate-700">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
              </span>
            </Link>

            <div className="h-7 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* User */}
            <div className="flex items-center gap-3 pl-1 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-indigo-700 transition-colors">{user?.email}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{user?.roles?.[0]}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-200/50 group-hover:shadow-lg group-hover:shadow-indigo-300/50 transition-all duration-200 uppercase">
                {user?.email?.[0] || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
