import { 
  PlusCircle, 
  Search, 
  Bell, 
  Briefcase,
  Stethoscope,
  Menu,
  X,
  User,
  Clock,
  LogOut
} from 'lucide-react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useCallback, memo, useEffect } from 'react';

import { useUser, useAuth, usePermissions } from '../hooks/use-user';
import { RoleBasedSidebar } from './RoleBasedSidebar';
import { CommandPalette } from './CommandPalette';

const MemoizedSidebar = memo(RoleBasedSidebar);
MemoizedSidebar.displayName = 'MemoizedSidebar';

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = useUser();
  const { logout } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const canRegisterPatient = isSuperAdmin || hasPermission('patient.create');
  const canAdmitQueue = isSuperAdmin || hasPermission('queue.manage');
  const canCreateOrder = isSuperAdmin || hasPermission('order.create');
  const showQuickCreateBtn = canRegisterPatient || canAdmitQueue || canCreateOrder;
  const showNotifications = isSuperAdmin || hasPermission('it.system.view') || hasPermission('compliance.audit.review');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

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
            <span className="font-bold text-lg text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>HMS Core</span>
            <p className="text-caption -mt-0.5">Healthcare Platform</p>
          </div>
        </div>
        <MemoizedSidebar pathname={location.pathname} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeMobileMenu} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="gradient-primary p-2 rounded-xl">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HMS Core</span>
              </div>
              <button onClick={closeMobileMenu} aria-label="Close mobile menu" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <MemoizedSidebar pathname={location.pathname} onNavClick={closeMobileMenu} />
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
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Search */}
            <div className="relative transition-all duration-300 ease-out max-w-sm w-full md:block hidden">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search patients, orders, or staff... (Ctrl+K)"
                aria-label="Search patients, orders, or staff"
                onClick={() => setIsCommandPaletteOpen(true)}
                onFocus={(e) => {
                  e.target.blur();
                  setIsCommandPaletteOpen(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300 cursor-pointer"
              />
            </div>

            {/* Mobile Search Icon */}
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="md:hidden p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 lg:gap-3">
            {/* Quick Create */}
            {showQuickCreateBtn && (
              <>
                <button
                  onClick={() => setShowQuickCreate(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Quick Create</span>
                </button>

                {/* Mobile Quick Create Icon */}
                <button
                  onClick={() => setShowQuickCreate(true)}
                  className="md:hidden p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                  aria-label="Quick Create"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Branch selector */}
            <div 
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-600"
              title="Branch switching is managed by your administrator"
            >
              <Briefcase className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span className="font-medium text-xs">Branch: {user?.branchId || 'None'}</span>
            </div>
            
            {/* Notifications */}
            {showNotifications && (
              <Link to="/notifications" className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:text-slate-700" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-notification-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
                </span>
              </Link>
            )}

            <div className="h-7 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* User identity + explicit Sign out */}
            <div
              data-testid="user-control"
              className="flex items-center gap-3 pl-1"
              title={user?.email || 'Signed in'}
            >
              <div className="hidden sm:block">
                <p
                  data-testid="user-email"
                  className="text-sm font-semibold text-slate-900 leading-none"
                >
                  {user?.email}
                </p>
                <p
                  data-testid="user-role"
                  className="text-caption mt-0.5"
                >
                  {user?.roles?.[0]}
                </p>
              </div>
              <div
                data-testid="user-avatar"
                aria-hidden="true"
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-200/50 uppercase"
              >
                {user?.email?.[0] || 'U'}
              </div>

              {/* Explicit sign-out button — no longer a misleading avatar click target.
                  Clicking opens an inline confirmation bar; only Confirm terminates the session. */}
              <button
                type="button"
                data-testid="logout-button"
                onClick={() => setShowLogoutConfirm(true)}
                aria-label="Sign out"
                className="ml-1 flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200/80 hover:border-rose-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Logout confirmation bar — appears just under the topbar when user clicks Sign out.
            Prevents the prior silent hard-logout from a single avatar click. */}
        {showLogoutConfirm && (
          <div
            role="alertdialog"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-body"
            data-testid="logout-confirm-bar"
            className="bg-rose-50 border-b border-rose-200 px-4 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div className="flex items-start gap-2">
              <LogOut className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p
                  id="logout-confirm-title"
                  className="text-sm font-semibold text-rose-900"
                >
                  Sign out of HMS?
                </p>
                <p
                  id="logout-confirm-body"
                  className="text-xs text-rose-800 mt-0.5"
                >
                  You will need to log in again to access patient records, orders, and audit logs.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                data-testid="logout-cancel"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="logout-confirm"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shadow-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-[1800px] mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Quick Create Dialog Modal */}
        {showQuickCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="quick-create-title" className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-slide-up relative">
              <button 
                onClick={() => setShowQuickCreate(false)} 
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h3 id="quick-create-title" className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3 border-slate-100 uppercase tracking-wider">
                <PlusCircle className="h-4.5 w-4.5 text-indigo-600" aria-hidden="true" />
                Quick Action Panel
              </h3>

              <div className="mt-4 space-y-2.5">
                {canRegisterPatient && (
                  <button
                    onClick={() => {
                      setShowQuickCreate(false);
                      navigate("/patients/new");
                    }}
                    className="w-full text-left p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">Register Patient</p>
                      <p className="text-caption mt-0.5">Enroll new record in master index</p>
                    </div>
                  </button>
                )}

                {canAdmitQueue && (
                  <button
                    onClick={() => {
                      setShowQuickCreate(false);
                      navigate("/queue");
                    }}
                    className="w-full text-left p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">Manage Patient Queue</p>
                      <p className="text-caption mt-0.5">View and manage active patient queue slots</p>
                    </div>
                  </button>
                )}

                {canCreateOrder && (
                  <button
                    onClick={() => {
                      setShowQuickCreate(false);
                      navigate("/orders/new");
                    }}
                    className="w-full text-left p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">Create Medical Order</p>
                      <p className="text-caption mt-0.5">Order imaging, labs or rx</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Command Palette */}
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      </div>
    </div>
  );
};
