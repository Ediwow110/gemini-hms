import React from "react";
import { Search } from "lucide-react";
import FieldServiceShellNotice from "./components/FieldServiceShellNotice";
import DeliveryJobTable from "./components/DeliveryJobTable";
import DeliveryJobsAdminView from "./components/DeliveryJobsAdminView";
import { useUser } from "../../hooks/use-user";
import { HmsPageHeader } from "../../components/hms-page";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";

export const DeliveryJobsPage: React.FC = () => {
  const user = useUser();
  const isAdmin = !!user && (user.roles.includes("Super Admin") || user.roles.includes("Branch Admin"));

  return (
    <HmsDashboardShell>
      <div className="space-y-6">
        <HmsPageHeader
          title="Delivery Jobs"
          description="Manage and track equipment dispatch and last-mile delivery"
        />

        <FieldServiceShellNotice />

        {isAdmin ? (
          <DeliveryJobsAdminView />
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Job ID or Customer..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  title="Simulation"
                  className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase cursor-not-allowed"
                >
                  Dispatch Queue (Shell)
                </button>
              </div>
            </div>
            <DeliveryJobTable />
          </>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default DeliveryJobsPage;
