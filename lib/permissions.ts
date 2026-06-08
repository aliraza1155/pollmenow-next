// lib/permissions.ts
// No 'use client' – pure functions, safe for server

export function getRole(user: any, orgId: string | null) {
  if (!orgId || !user?.memberships) return null;
  return user.memberships[orgId]?.role || null;
}

export function canManageTeam(user: any, orgId: string | null) {
  const role = getRole(user, orgId);
  return role === 'owner' || role === 'admin';
}

export function canDeleteOrganization(user: any, orgId: string | null) {
  const role = getRole(user, orgId);
  return role === 'owner';
}

export function canEditOrgProfile(user: any, orgId: string | null) {
  const role = getRole(user, orgId);
  return role === 'owner' || role === 'admin';
}

export function canManageOrgBilling(user: any, orgId: string | null) {
  const role = getRole(user, orgId);
  return role === 'owner';
}

// ✅ Fixed: accept string | null (like the original JS)
export function canCreatePoll(user: any, activeAccount: string | null, orgId: string | null) {
  if (activeAccount === 'personal') return true;
  const role = getRole(user, orgId);
  return role === 'owner' || role === 'admin' || role === 'poll_manager';
}

export function canEditPoll(user: any, poll: any) {
  if (poll.context?.type === 'personal') {
    return poll.creator?.id === user?.uid;
  }
  if (poll.context?.type === 'organization') {
    const role = getRole(user, poll.context.orgId);
    if (role === 'owner' || role === 'admin') return true;
    if (role === 'poll_manager') {
      return poll.creator?.id === user?.uid;
    }
    return false;
  }
  return false;
}
export const canDeletePoll = canEditPoll;

export function canViewAnalytics(user: any, poll: any) {
  if (poll.context?.type === 'personal') {
    return poll.creator?.id === user?.uid;
  }
  if (poll.context?.type === 'organization') {
    const role = getRole(user, poll.context.orgId);
    return role === 'owner' || role === 'admin' || role === 'poll_manager' || role === 'analyst';
  }
  return false;
}

export function canViewOrgAnalytics(user: any, orgId: string | null) {
  const role = getRole(user, orgId);
  return role === 'owner' || role === 'admin' || role === 'poll_manager' || role === 'analyst';
}

// ========== ROLE-BASED PERMISSIONS FOR ORGANIZATION ACTIONS ==========

export function canCreatePollInOrg(role: string | null) {
  return role === 'owner' || role === 'admin' || role === 'poll_manager';
}

export function canSchedulePollInOrg(role: string | null) {
  return role === 'owner' || role === 'admin' || role === 'poll_manager';
}

export function canEditAnyPollInOrg(role: string | null) {
  return role === 'owner' || role === 'admin' || role === 'poll_manager';
}

export function canViewAdvancedAnalytics(role: string | null) {
  return role === 'owner' || role === 'admin' || role === 'poll_manager' || role === 'analyst';
}

export function canViewBasicAnalytics(_role: string | null) {
  return true;
}

export function canViewTeamTab(_role: string | null) {
  return true;
}

export function canAccessAnalyticsTab(_role: string | null) {
  return true;
}