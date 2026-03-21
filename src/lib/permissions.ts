// Permissions system for AutoPass Numérique
// Role hierarchy: superadmin > admin > agent > garage > driver

export type Role = 'superadmin' | 'admin' | 'agent' | 'garage' | 'driver';

export const ROLES: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrateur',
  agent: 'Agent',
  garage: 'Garage Partenaire',
  driver: 'Conducteur'
};

export const ROLE_COLORS: Record<Role, string> = {
  superadmin: 'bg-purple-500',
  admin: 'bg-blue-500',
  agent: 'bg-green-500',
  garage: 'bg-orange-500',
  driver: 'bg-cyan-500'
};

// Permission definitions
export const PERMISSIONS = {
  // Full access
  ALL: '*',

  // Dashboard & Navigation
  VIEW_DASHBOARD: 'view_dashboard',

  // Vehicle management
  VIEW_VEHICLES: 'view_vehicles',
  MANAGE_VEHICLES: 'manage_vehicles',
  DELETE_VEHICLES: 'delete_vehicles',
  ACTIVATE_QR: 'activate_qr',

  // QR Code Lot management
  VIEW_QR_LOTS: 'view_qr_lots',
  CREATE_QR_LOTS: 'create_qr_lots',
  ASSIGN_QR_LOTS: 'assign_qr_lots',

  // Maintenance Records
  VIEW_MAINTENANCE_RECORDS: 'view_maintenance_records',
  CREATE_MAINTENANCE_RECORDS: 'create_maintenance_records',
  VALIDATE_MAINTENANCE_RECORDS: 'validate_maintenance_records', // For owners
  MANAGE_MAINTENANCE_RECORDS: 'manage_maintenance_records', // For garages

  // Garage management
  VIEW_GARAGES: 'view_garages',
  MANAGE_GARAGES: 'manage_garages',
  DELETE_GARAGES: 'delete_garages',
  CERTIFY_GARAGES: 'certify_garages', // SuperAdmin only

  // User management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  DELETE_USERS: 'delete_users',
  CREATE_DRIVERS: 'create_drivers', // For garages

  // Reports & Analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',

  // Messages & Support
  VIEW_MESSAGES: 'view_messages',
  RESPOND_MESSAGES: 'respond_messages',
  SEND_MESSAGES: 'send_messages',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_PAYPAL: 'manage_paypal',
  MANAGE_FEATURES: 'manage_features',

  // CRM (Leads)
  VIEW_CRM: 'view_crm',
  MANAGE_CRM: 'manage_crm',

  // Notifications
  VIEW_NOTIFICATIONS: 'view_notifications',

  // Ownership History
  VIEW_OWNERSHIP_HISTORY: 'view_ownership_history',
  TRANSFER_OWNERSHIP: 'transfer_ownership',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permissions (Option A: Static)
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    PERMISSIONS.ALL // Full access
  ],

  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.DELETE_VEHICLES,
    PERMISSIONS.VIEW_QR_LOTS,
    PERMISSIONS.CREATE_QR_LOTS,
    PERMISSIONS.ASSIGN_QR_LOTS,
    PERMISSIONS.VIEW_MAINTENANCE_RECORDS,
    PERMISSIONS.MANAGE_MAINTENANCE_RECORDS,
    PERMISSIONS.VIEW_GARAGES,
    PERMISSIONS.MANAGE_GARAGES,
    PERMISSIONS.CERTIFY_GARAGES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.RESPOND_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_FEATURES,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.MANAGE_CRM,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],

  agent: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_MAINTENANCE_RECORDS,
    PERMISSIONS.VIEW_QR_LOTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.RESPOND_MESSAGES,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],

  garage: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_VEHICLES, // Only vehicles they service
    PERMISSIONS.ACTIVATE_QR,
    PERMISSIONS.VIEW_QR_LOTS,
    PERMISSIONS.VIEW_MAINTENANCE_RECORDS,
    PERMISSIONS.CREATE_MAINTENANCE_RECORDS,
    PERMISSIONS.MANAGE_MAINTENANCE_RECORDS, // Own records
    PERMISSIONS.CREATE_DRIVERS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.SEND_MESSAGES, // To superadmin
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWNERSHIP_HISTORY,
  ],

  driver: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_VEHICLES, // Own vehicles only
    PERMISSIONS.VIEW_MAINTENANCE_RECORDS, // Own vehicle records
    PERMISSIONS.VALIDATE_MAINTENANCE_RECORDS, // Validate/reject garage reports
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWNERSHIP_HISTORY,
    PERMISSIONS.TRANSFER_OWNERSHIP,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: string, permission: Permission): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as Role];
  if (!rolePerms) return false;

  // superadmin has all permissions
  if (rolePerms.includes(PERMISSIONS.ALL)) return true;

  return rolePerms.includes(permission);
}

// Check if a role has ANY of the specified permissions
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(perm => hasPermission(role, perm));
}

// Check if a role has ALL of the specified permissions
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(perm => hasPermission(role, perm));
}

// Get all permissions for a role
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] || [];
}

// Check if user can access a specific route
export function canAccessRoute(role: string, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/admin': [PERMISSIONS.VIEW_DASHBOARD],
    
    '/admin/qrcodes': [PERMISSIONS.VIEW_QR_LOTS],
    '/admin/garages': [PERMISSIONS.VIEW_GARAGES],
    '/admin/certifications': [PERMISSIONS.CERTIFY_GARAGES],
    '/admin/utilisateurs': [PERMISSIONS.VIEW_USERS],
    '/admin/rapports': [PERMISSIONS.VIEW_REPORTS],
    '/admin/messages': [PERMISSIONS.VIEW_MESSAGES],
    '/admin/crm': [PERMISSIONS.VIEW_CRM],
    '/admin/parametres': [PERMISSIONS.VIEW_SETTINGS],
    '/admin/parametres/fonctionnalites': [PERMISSIONS.MANAGE_FEATURES],
    '/garage': [PERMISSIONS.VIEW_DASHBOARD],
    '/garage/vehicules': [PERMISSIONS.VIEW_VEHICLES],
    '/garage/interventions': [PERMISSIONS.CREATE_MAINTENANCE_RECORDS],
    '/garage/qr-lots': [PERMISSIONS.VIEW_QR_LOTS],
    '/driver': [PERMISSIONS.VIEW_DASHBOARD],
    '/driver/vehicule': [PERMISSIONS.VIEW_VEHICLES],
    '/driver/historique': [PERMISSIONS.VIEW_MAINTENANCE_RECORDS],
    '/driver/validation': [PERMISSIONS.VALIDATE_MAINTENANCE_RECORDS],
  };

  const requiredPerms = routePermissions[route];
  if (!requiredPerms) return true; // No restriction if not defined

  return hasAnyPermission(role, requiredPerms);
}

// Get navigation items based on role
export function getNavigationItems(role: string, context: 'admin' | 'garage' | 'driver' = 'admin') {
  // SuperAdmin / Admin Navigation
  if (context === 'admin' || role === 'superadmin' || role === 'admin' || role === 'agent') {
    const items = [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: 'LayoutDashboard',
        permission: PERMISSIONS.VIEW_DASHBOARD,
      },
      {
        label: 'Véhicules',
        href: '/admin/vehicules',
        icon: 'Car',
        permission: PERMISSIONS.VIEW_VEHICLES,
      },
      {
        label: 'Lots QR',
        href: '/admin/qrcodes',
        icon: 'QrCode',
        permission: PERMISSIONS.VIEW_QR_LOTS,
      },
      {
        label: 'Garages',
        href: '/admin/garages',
        icon: 'Building2',
        permission: PERMISSIONS.VIEW_GARAGES,
      },
      {
        label: 'Certifications',
        href: '/admin/certifications',
        icon: 'Shield',
        permission: PERMISSIONS.CERTIFY_GARAGES,
      },
      {
        label: 'Utilisateurs',
        href: '/admin/utilisateurs',
        icon: 'Users',
        permission: PERMISSIONS.VIEW_USERS,
      },
      {
        label: 'Messages',
        href: '/admin/messages',
        icon: 'MessageSquare',
        permission: PERMISSIONS.VIEW_MESSAGES,
      },
      {
        label: 'CRM',
        href: '/admin/crm',
        icon: 'UserPlus',
        permission: PERMISSIONS.VIEW_CRM,
      },
      {
        label: 'Rapports',
        href: '/admin/rapports',
        icon: 'BarChart3',
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        label: 'Paramètres',
        href: '/admin/parametres',
        icon: 'Settings',
        permission: PERMISSIONS.VIEW_SETTINGS,
      },
    ];

    return items.filter(item => hasPermission(role, item.permission));
  }

  // Garage Navigation
  if (context === 'garage' || role === 'garage') {
    return [
      {
        label: 'Dashboard',
        href: '/garage/tableau-de-bord',
        icon: 'LayoutDashboard',
      },
      {
        label: 'Véhicules',
        href: '/garage/vehicules',
        icon: 'Car',
      },
      {
        label: 'Interventions',
        href: '/garage/interventions',
        icon: 'Wrench',
      },
      {
        label: 'Activer QR',
        href: '/garage/activer-qr',
        icon: 'QrCode',
      },
      {
        label: 'Inscrire Conducteur',
        href: '/garage/inscrire',
        icon: 'UserPlus',
      },
      {
        label: 'Messages',
        href: '/garage/messages',
        icon: 'MessageSquare',
      },
      {
        label: 'Profil',
        href: '/garage/profil',
        icon: 'Building2',
      },
    ];
  }

  // Driver Navigation
  if (context === 'driver' || role === 'driver') {
    return [
      {
        label: 'Mon Véhicule',
        href: '/driver/vehicule',
        icon: 'Car',
      },
      {
        label: 'Historique',
        href: '/driver/historique',
        icon: 'History',
      },
      {
        label: 'Validations',
        href: '/driver/validation',
        icon: 'CheckCircle',
      },
      {
        label: 'QR Code',
        href: '/driver/qr-code',
        icon: 'QrCode',
      },
      {
        label: 'Transférer',
        href: '/driver/transferer',
        icon: 'ArrowRightLeft',
      },
      {
        label: 'Profil',
        href: '/driver/profil',
        icon: 'User',
      },
    ];
  }

  return [];
}
