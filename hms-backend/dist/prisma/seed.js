"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seed started...');
    const tenant = await prisma.tenant.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Central Hospital (Main Branch)',
            status: 'ACTIVE',
        },
    });
    console.log('Tenant created:', tenant.name);
    const permissionsData = [
        { name: 'patient.view', scope: 'tenant/branch' },
        { name: 'patient.create', scope: 'tenant/branch' },
        { name: 'patient.update', scope: 'tenant/branch' },
        { name: 'patient.merge.request', scope: 'tenant' },
        { name: 'patient.merge.approve', scope: 'tenant' },
        { name: 'order.create', scope: 'tenant/branch' },
        { name: 'order.cancel', scope: 'tenant/branch' },
        { name: 'order.view', scope: 'tenant/branch' },
        { name: 'billing.payment.create', scope: 'tenant/branch/cashier session' },
        { name: 'billing.invoice.view', scope: 'tenant/branch' },
        { name: 'billing.refund.request', scope: 'tenant/branch' },
        { name: 'billing.refund.approve', scope: 'tenant/branch' },
        { name: 'billing.payment.void.request', scope: 'tenant/branch' },
        { name: 'lab.result.encode', scope: 'tenant/branch/department' },
        { name: 'lab.result.validate', scope: 'tenant/branch/department' },
        { name: 'lab.result.approve', scope: 'tenant/branch/department' },
        { name: 'lab.result.release', scope: 'tenant/branch/department' },
        { name: 'lab.result.view', scope: 'tenant/branch/department' },
        { name: 'lab.result.amend.request', scope: 'tenant/branch' },
        { name: 'inventory.adjust.request', scope: 'tenant/branch' },
        { name: 'inventory.adjust.approve', scope: 'tenant/branch' },
        { name: 'report.export', scope: 'tenant/branch/role scope' },
        { name: 'audit.view', scope: 'tenant/branch/role scope' },
        { name: 'admin.role.change', scope: 'tenant/system' },
        { name: 'approval.request.create', scope: 'tenant/branch' },
        { name: 'approval.request.view', scope: 'tenant/branch' },
        { name: 'approval.request.process', scope: 'tenant/branch' },
    ];
    console.log('Seeding Permissions...');
    for (const p of permissionsData) {
        await prisma.permission.upsert({
            where: {
                tenantId_name: {
                    tenantId: tenant.id,
                    name: p.name,
                },
            },
            update: { scope: p.scope },
            create: {
                tenantId: tenant.id,
                name: p.name,
                scope: p.scope,
            },
        });
    }
    const rolesData = [
        { name: 'Super Admin', id: '00000000-0000-0000-0000-000000000002' },
        { name: 'Branch Admin', id: '00000000-0000-0000-0000-000000000003' },
        { name: 'Receptionist', id: '00000000-0000-0000-0000-000000000004' },
        { name: 'Cashier', id: '00000000-0000-0000-0000-000000000005' },
        { name: 'Med-Tech', id: '00000000-0000-0000-0000-000000000006' },
        { name: 'Doctor', id: '00000000-0000-0000-0000-000000000007' },
    ];
    console.log('Seeding Roles...');
    for (const r of rolesData) {
        await prisma.role.upsert({
            where: { id: r.id },
            update: {},
            create: {
                id: r.id,
                tenantId: tenant.id,
                name: r.name,
            },
        });
    }
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const user = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'admin@hospital.com'
            }
        },
        update: {
            passwordHash: passwordHash
        },
        create: {
            tenantId: tenant.id,
            email: 'admin@hospital.com',
            passwordHash: passwordHash,
            isMfaEnabled: false,
        },
    });
    console.log('User created:', user.email);
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: user.id,
                roleId: '00000000-0000-0000-0000-000000000002'
            }
        },
        update: {},
        create: {
            userId: user.id,
            roleId: '00000000-0000-0000-0000-000000000002',
        },
    });
    console.log('User linked to role.');
    const allRoles = await prisma.role.findMany({ where: { tenantId: tenant.id } });
    const allPerms = await prisma.permission.findMany({ where: { tenantId: tenant.id } });
    const rolePermissionMap = {
        'Super Admin': permissionsData.map(p => p.name),
        'Receptionist': [
            'patient.view', 'patient.create', 'patient.update',
            'order.create', 'order.view'
        ],
        'Cashier': [
            'patient.view', 'order.view', 'billing.invoice.view',
            'billing.payment.create', 'billing.refund.request'
        ],
        'Med-Tech': [
            'patient.view', 'lab.result.view', 'lab.result.encode'
        ],
        'Doctor': [
            'patient.view', 'lab.result.view', 'lab.result.approve', 'lab.result.release'
        ]
    };
    console.log('Seeding Role Permissions...');
    for (const roleName of Object.keys(rolePermissionMap)) {
        const role = allRoles.find(r => r.name === roleName);
        if (!role)
            continue;
        const permsToAssign = rolePermissionMap[roleName];
        for (const permName of permsToAssign) {
            const permission = allPerms.find(p => p.name === permName);
            if (!permission)
                continue;
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                },
                update: {},
                create: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            });
        }
    }
    console.log('Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map