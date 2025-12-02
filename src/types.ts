export interface Tenant {
  id: number | string
  name: string
  slug?: string
  domain?: string
}

export interface UserTenantAssignment {
  tenant: number | string | Tenant
  role?: 'tenant-admin' | 'tenant-user'
}
