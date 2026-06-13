import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const roleCount = await p.role.count();
console.log("roles:", roleCount);
if (roleCount > 0) {
  const roles = await p.role.findMany({ take: 20, orderBy: { name: "asc" } });
  console.log("role names:", roles.map(r => r.name).join(", "));
  const pharmacist = await p.role.findFirst({ where: { name: "Pharmacist" } });
  console.log("Pharmacist exists:", !!pharmacist);
  if (pharmacist) {
    const perms = await p.rolePermission.findMany({ where: { roleId: pharmacist.id }, include: { permission: true } });
    console.log("Pharmacist permissions:", perms.map(p => p.permission.name).join(", "));
  }
}
const userCount = await p.user.count();
console.log("users:", userCount);
await p.$disconnect();
