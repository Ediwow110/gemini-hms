# Admin Auth Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "Reset Password" and "Force Logout" administrative actions for users.

**Architecture:** 
- **Force Logout:** Instead of managing individual session records from the Admin module, we will increment the `tokenVersion` on the `User` record. This instantly invalidates all existing JWTs.
- **Reset Password:** Generates a secure temporary password, hashes it, updates the `User` record, increments `tokenVersion` (logging them out), and returns the plain temporary password so the admin can securely provide it to the user.
- **Frontend:** Remove "WIP" disables in `UserDetail.tsx`. Wire both actions to prompt for a minimum 8-character reason via `ReasonModal`, call the new endpoints, and display the temporary password if applicable.

**Tech Stack:** NestJS, Prisma, React, bcrypt.

---

### Task 1: Backend Service Implementation

**Files:**
- Modify: `hms-backend/src/admin/admin.service.ts`

- [ ] **Step 1: Add crypto import**
(Note: `* as bcrypt from 'bcrypt'` is already imported in `admin.service.ts`.)

- [ ] **Step 2: Add forceLogout and resetPassword methods**

```typescript
// hms-backend/src/admin/admin.service.ts
  async forceLogout(actor: RequestUser, targetUserId: string, reason: string): Promise<AdminUserLifecycleResponse> {
    const trimmedReason = this.validateReason(reason);
    this.assertActorCanTarget(actor, targetUserId);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertNonPrivilegedTarget(target);

      const updateResult = await tx.user.updateMany({
        where: {
          id: targetUserId,
          tenantId: actor.tenantId,
          ...this.getBranchMutationScope(actor),
        },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('User access scope changed before logout could be enforced');
      }

      const changedAt = new Date();
      const updated = await this.getUpdatedUser(tx, actor.tenantId, targetUserId);
      const branchId = this.getAuditBranchId(actor, target);

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'USER_FORCE_LOGOUT',
          recordType: 'User',
          recordId: targetUserId,
          oldValues: this.buildAuditOldValues(target),
          newValues: this.buildAuditNewValues(
            actor,
            targetUserId,
            updated,
            trimmedReason,
            changedAt,
          ),
        },
        tx,
        branchId,
      );

      return this.toLifecycleResponse(updated, target);
    });
  }

  async resetPassword(actor: RequestUser, targetUserId: string, reason: string): Promise<{ user: AdminUserLifecycleResponse; tempPassword: string }> {
    const trimmedReason = this.validateReason(reason);
    this.assertActorCanTarget(actor, targetUserId);

    // Generate a temporary password
    const tempPassword = 'Temp' + Math.random().toString(36).slice(-8) + '!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertNonPrivilegedTarget(target);

      const updateResult = await tx.user.updateMany({
        where: {
          id: targetUserId,
          tenantId: actor.tenantId,
          ...this.getBranchMutationScope(actor),
        },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('User access scope changed before password reset could be enforced');
      }

      const changedAt = new Date();
      const updated = await this.getUpdatedUser(tx, actor.tenantId, targetUserId);
      const branchId = this.getAuditBranchId(actor, target);

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'USER_PASSWORD_RESET',
          recordType: 'User',
          recordId: targetUserId,
          oldValues: this.buildAuditOldValues(target),
          newValues: this.buildAuditNewValues(
            actor,
            targetUserId,
            updated,
            trimmedReason,
            changedAt,
          ),
        },
        tx,
        branchId,
      );

      return {
        user: this.toLifecycleResponse(updated, target),
        tempPassword,
      };
    });
  }
```

- [ ] **Step 3: Commit**

```bash
git add hms-backend/src/admin/admin.service.ts
git commit -m "feat(backend): implement forceLogout and resetPassword service methods"
```

---

### Task 2: Backend Controller Implementation

**Files:**
- Modify: `hms-backend/src/admin/admin.controller.ts`

- [ ] **Step 1: Add new endpoints to AdminController**

```typescript
// hms-backend/src/admin/admin.controller.ts
  @Post('users/:id/force-logout')
  @RequirePermissions('admin.role.change')
  async forceLogout(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.forceLogout(actor, targetUserId, dto.reason);
  }

  @Post('users/:id/reset-password')
  @RequirePermissions('admin.role.change')
  async resetPassword(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.resetPassword(actor, targetUserId, dto.reason);
  }
```

- [ ] **Step 2: Commit**

```bash
git add hms-backend/src/admin/admin.controller.ts
git commit -m "feat(backend): expose force-logout and reset-password endpoints"
```

---

### Task 3: Frontend API Service Updates

**Files:**
- Modify: `hms-frontend/src/services/admin.service.ts`

- [ ] **Step 1: Add forceLogout and resetPassword to adminService**

```typescript
// hms-frontend/src/services/admin.service.ts
  async forceLogout(id: string, reason: string): Promise<void> {
    await apiClient.post(`/v1/admin/users/${id}/force-logout`, { reason });
  },

  async resetPassword(id: string, reason: string): Promise<{ tempPassword: string }> {
    const response = await apiClient.post(`/v1/admin/users/${id}/reset-password`, { reason });
    return response.data;
  },
```

- [ ] **Step 2: Commit**

```bash
git add hms-frontend/src/services/admin.service.ts
git commit -m "feat(frontend): add API methods for reset password and force logout"
```

---

### Task 4: Frontend UI Wiring

**Files:**
- Modify: `hms-frontend/src/features/admin/UserDetail.tsx`

- [ ] **Step 1: Update UserDetail.tsx to support the new flows**

Update `modals` state and add new handler functions.

```tsx
// Inside UserDetail component:
  const [modals, setModals] = useState({ reset: false, forceLogout: false, suspend: false, changeRole: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleForceLogout = async (reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await adminService.forceLogout(id, reason);
      alert("User has been forcibly logged out.");
      setModals({...modals, forceLogout: false});
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to force logout user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await adminService.resetPassword(id, reason);
      setTempPassword(res.tempPassword);
      setModals({...modals, reset: false});
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };
```

- [ ] **Step 2: Update buttons and modals**

Remove the `disabled` state from buttons, wire their `onClick` events, and update the modals. Replace `ConfirmationModal` for reset with a `ReasonModal`.

```tsx
// Buttons section:
              <button
                onClick={() => setModals({...modals, reset: true})}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                disabled={actionLoading || suspendLoading}
              >
                <KeyRound className="h-4 w-4" />
                Reset Password
              </button>
              <button
                onClick={() => setModals({...modals, forceLogout: true})}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                disabled={actionLoading || suspendLoading}
              >
                <LogOut className="h-4 w-4" />
                Force Logout
              </button>

// Modals section at bottom:
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Password Reset Successful</h3>
            <p className="text-sm text-slate-600 mb-4">Please provide this temporary password securely to the user. It will not be shown again.</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-center text-lg mb-6">
              {tempPassword}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setTempPassword(null)} className="btn btn-primary">Done</button>
            </div>
          </div>
        </div>
      )}

      <ReasonModal
        isOpen={modals.reset}
        title="Reset Password"
        guidance={`Reason for password reset required. Minimum 8 characters.`}
        onConfirm={handleResetPassword}
        onClose={() => setModals({...modals, reset: false})}
      />

      <ReasonModal
        isOpen={modals.forceLogout}
        title="Force Logout"
        guidance={`Reason for forcing logout required. Minimum 8 characters.`}
        onConfirm={handleForceLogout}
        onClose={() => setModals({...modals, forceLogout: false})}
      />
```

- [ ] **Step 3: Commit**

```bash
git add hms-frontend/src/features/admin/UserDetail.tsx
git commit -m "feat(frontend): wire reset password and force logout to UI"
```

---

### Task 5: Validation

- [ ] **Step 1: Run Backend Build & Lint**
- [ ] **Step 2: Run Frontend Build & Lint**
