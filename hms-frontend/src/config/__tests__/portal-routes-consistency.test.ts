import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { roleNavigation, type NavItemConfig } from '../roleNavigation';
import { getPortalRouteConfig, portalRoutes } from '../portalRoutes';
import { PERMISSIONS } from '../permissions';

const flattenItems = (items: NavItemConfig[]): NavItemConfig[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])]);

describe('canonical portal route policy', () => {
  it('covers every protected App route, including nested settings children', () => {
    const appSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/App.tsx'),
      'utf8',
    );
    const routePaths = [...appSource.matchAll(/\{\s*path:\s*['"]([^'"]+)['"]/g)]
      .map((match) => match[1]);
    const settingsChildren = new Set([
      'branches',
      'departments',
      'services',
      'numbering',
      'templates',
      'notifications',
      'security',
    ]);

    const unresolved = [...new Set(routePaths)]
      .filter((routePath) => routePath !== '/login')
      .map((routePath) =>
        settingsChildren.has(routePath)
          ? `/settings/${routePath}`
          : routePath.startsWith('/')
            ? routePath
            : `/${routePath}`,
      )
      .filter((routePath) => !getPortalRouteConfig(routePath));

    expect(unresolved).toEqual([]);
  });

  it('resolves every navigation destination through the route catalog', () => {
    const unresolved = roleNavigation
      .flatMap((group) => flattenItems(group.items))
      .filter((item) => !getPortalRouteConfig(item.to))
      .map((item) => `${item.label}:${item.to}`);

    expect(unresolved).toEqual([]);
  });

  it('prefers static routes over dynamic routes with the same segment count', () => {
    expect(getPortalRouteConfig('/inventory/receiving')?.path).toBe(
      'inventory/receiving',
    );
    expect(getPortalRouteConfig('/inventory/item-123')?.path).toBe(
      'inventory/:id',
    );
  });

  it('uses granular permission-first field-service access for built-in and custom roles', () => {
    const delivery = getPortalRouteConfig('/field-service/deliveries');
    expect(delivery).toMatchObject({
      requiredPermission: PERMISSIONS.FIELD_SERVICE_JOB_VIEW,
      isBranchScoped: true,
    });
    expect(delivery?.allowedRoles).toBeUndefined();

    const proof = getPortalRouteConfig('/field-service/proof-of-delivery');
    expect(proof?.requiredPermission).toBe(
      PERMISSIONS.FIELD_SERVICE_DELIVERY_PROOF_CREATE,
    );
  });

  it('keeps patient and supplier zones role-restricted instead of permission-bypassed', () => {
    expect(getPortalRouteConfig('/patient')?.allowedRoles).toEqual(['Patient']);
    expect(getPortalRouteConfig('/supplier')?.allowedRoles).toEqual([
      'Supplier',
      'Supplier Admin',
      'Marketplace Supplier',
    ]);
  });

  it('contains no duplicate route patterns with conflicting policy', () => {
    const grouped = new Map<string, typeof portalRoutes>();
    for (const route of portalRoutes) {
      grouped.set(route.path, [...(grouped.get(route.path) || []), route]);
    }

    const conflicts = [...grouped.entries()]
      .filter(([, routes]) => routes.length > 1)
      .filter(([, routes]) => {
        const signatures = new Set(
          routes.map((route) =>
            JSON.stringify({
              requiredPermission: route.requiredPermission,
              allowedRoles: route.allowedRoles,
              zone: route.zone,
              isBranchScoped: route.isBranchScoped,
            }),
          ),
        );
        return signatures.size > 1;
      })
      .map(([path]) => path);

    expect(conflicts).toEqual([]);
  });
});
