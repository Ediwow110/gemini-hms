import { describe, it, expect } from "vitest";
import { portalRoutes } from "../config/portalRoutes";

describe("Dashboard route access control", () => {
  const UNINTENDED_ROLES = [
    "Doctor",
    "Nurse",
    "Cashier",
    "Pharmacist",
    "Lab Technician",
    "Patient",
    "Supplier",
    "IT Support",
    "HR Manager",
    "Procurement Manager",
    "Procurement Agent",
    "Marketplace Admin",
    "Compliance Officer",
    "Finance",
    "Marketplace Buyer",
    "Customer",
    "Supplier Admin",
    "Marketplace Supplier",
    "Field Technician",
  ];

  const dashboardRouteChecks: {
    path: string;
    expectedRoles?: string[];
    expectedPermission?: string;
    description: string;
  }[] = [
    {
      path: "admin",
      expectedRoles: ["Super Admin"],
      description: "Super Admin portal route scoped to Super Admin only",
    },
    {
      path: "admin/tenants",
      expectedRoles: ["Super Admin"],
      description: "Tenants page scoped to Super Admin only",
    },
    {
      path: "admin/branches",
      expectedRoles: ["Super Admin"],
      description: "Branches page scoped to Super Admin only",
    },
    {
      path: "clinical/ops",
      expectedRoles: ["Super Admin", "Branch Admin", "Doctor", "Nurse"],
      description: "Clinical Ops dashboard accessible to clinical roles",
    },
    {
      path: "branch-admin",
      expectedRoles: ["Super Admin", "Branch Admin"],
      description: "Branch Admin dashboard accessible to branch governance roles",
    },
    {
      path: "compliance",
      expectedRoles: ["Super Admin", "Compliance Officer"],
      description: "Compliance dashboard accessible to compliance roles",
    },
    {
      path: "it",
      expectedRoles: ["Super Admin", "IT Support"],
      description: "IT Support dashboard accessible to IT roles",
    },
    {
      path: "integration",
      expectedRoles: [
        "Super Admin",
        "IT Support",
        "Marketplace Admin",
        "Branch Admin",
      ],
      description: "Integration dashboard accessible to admin roles",
    },
    {
      path: "marketplace-admin",
      expectedRoles: ["Super Admin", "Marketplace Admin"],
      description: "Marketplace admin dashboard scoped to admin roles",
    },
    {
      path: "cashier",
      expectedRoles: ["Super Admin", "Branch Admin", "Cashier", "Finance"],
      description: "Cashier dashboard accessible to finance roles",
    },
    {
      path: "hr",
      expectedRoles: ["Super Admin", "Branch Admin", "HR Manager", "HR Staff"],
      description: "HR dashboard accessible to HR roles",
    },
    {
      path: "procurement",
      expectedRoles: [
        "Super Admin",
        "Branch Admin",
        "Procurement Manager",
        "Procurement Agent",
        "Procurement Officer",
      ],
      description: "Procurement dashboard accessible to procurement roles",
    },
    {
      path: "pharmacy/dashboard",
      expectedRoles: ["Super Admin", "Branch Admin", "Pharmacist"],
      description: "Pharmacy dashboard accessible to pharmacy roles",
    },
  ];

  describe("portalRoutes contains expected dashboard entries", () => {
    for (const { path, description } of dashboardRouteChecks) {
      it(`has entry for ${path}`, () => {
        const route = portalRoutes.find((r) => r.path === path);
        expect(
          route,
          `Missing portalRoutes entry for "${path}": ${description}`,
        ).toBeDefined();
      });
    }
  });

  describe("portalRoutes dashboard allowedRoles are not accidentally broad", () => {
    for (const { path, expectedRoles } of dashboardRouteChecks) {
      it(`${path} does not contain unintended roles`, () => {
        const route = portalRoutes.find((r) => r.path === path);
        if (!route) return;
        const roles = route.allowedRoles || [];
        if (route.requiredPermission) return;
        for (const unwanted of UNINTENDED_ROLES) {
          if (expectedRoles && expectedRoles.includes(unwanted)) continue;
          expect(roles).not.toContain(unwanted);
        }
      });
    }
  });
});
