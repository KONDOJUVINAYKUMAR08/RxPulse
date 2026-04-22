export const ROLES = {
  PHARMACIST: 'pharmacist',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const isAdmin = (role) => role === ROLES.ADMIN;
export const isManager = (role) => role === ROLES.MANAGER || role === ROLES.ADMIN;
export const isPharmacist = (role) => role === ROLES.PHARMACIST;

export const canManageMedicines = (role) => [ROLES.MANAGER, ROLES.ADMIN].includes(role);
export const canDeleteMedicines = (role) => role === ROLES.ADMIN;
export const canResolveAlerts = (role) => [ROLES.MANAGER, ROLES.ADMIN].includes(role);
export const canViewReports = (role) => [ROLES.MANAGER, ROLES.ADMIN].includes(role);
export const canManageUsers = (role) => role === ROLES.ADMIN;
export const canRecordStock = (role) => [ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN].includes(role);

export const getRoleBadgeClass = (role) => {
  switch (role) {
    case ROLES.ADMIN: return 'badge-red';
    case ROLES.MANAGER: return 'badge-blue';
    case ROLES.PHARMACIST: return 'badge-green';
    default: return 'badge-slate';
  }
};

export const getRoleLabel = (role) => {
  switch (role) {
    case ROLES.ADMIN: return 'Admin';
    case ROLES.MANAGER: return 'Manager';
    case ROLES.PHARMACIST: return 'Pharmacist';
    default: return role;
  }
};
