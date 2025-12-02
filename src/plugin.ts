import type { Config, Plugin } from 'payload'
import { getSelectedTenantFromCookie, extractTenantId } from './lib/helpers'

export interface MultiTenantPluginOptions {
  /**
   * Slug of the tenants collection
   * @default 'tenants'
   */
  tenantsSlug?: string

  /**
   * Collections to be tenant-scoped
   * Key = collection slug
   */
  collections?: Record<string, {
    /**
     * Field name for tenant relationship
     * @default 'tenants'
     */
    fieldName?: string
  }>

  /**
   * Function to determine if user has access to all tenants (super-admin)
   */
  userHasAccessToAllTenants?: (user: any) => boolean

  /**
   * Cookie name for selected tenant
   * @default 'payload-selected-tenant'
   */
  cookieName?: string

  /**
   * Slug of the auth collection (usually 'users')
   * If provided, role labels will be modified to add "(Global)" suffix for super-admins
   * @default 'users'
   */
  authCollectionSlug?: string
}

/**
 * Extract tenant IDs from user object
 * @param user - User object with tenants array
 * @returns Array of tenant IDs
 */
const extractUserTenantIds = (user: any): (number | string)[] => {
  if (!user?.tenants || !Array.isArray(user.tenants)) {
    return []
  }

  return user.tenants
    .map((t: any) => extractTenantId(t.tenant))
    .filter((id): id is number | string => id !== null)
}

/**
 * Multi-tenant plugin for Payload CMS 3.x with React 19 and Next.js 15 support
 * Automatically adds tenant filtering to specified collections
 */
export const multiTenantPlugin = (
  pluginOptions: MultiTenantPluginOptions = {}
): Plugin => {
  return (incomingConfig: Config): Config => {
    const {
      tenantsSlug = 'tenants',
      collections = {},
      userHasAccessToAllTenants = (user) => user?.role === 'super-admin',
      cookieName = 'payload-selected-tenant',
      authCollectionSlug = 'users',
    } = pluginOptions

    // Clone the config to avoid mutating the original
    const config = { ...incomingConfig }

    // Add tenant field and access control to each configured collection
    if (config.collections) {
      config.collections = config.collections.map((collection) => {
        const collectionSlug = typeof collection === 'object' ? collection.slug : collection
        const collectionConfig = collections[collectionSlug]

        // Skip if not configured for multi-tenancy
        if (!collectionConfig) {
          return collection
        }

        const fieldName = collectionConfig.fieldName || 'tenants'

        // Add tenants field
        const updatedCollection = {
          ...collection,
          fields: [
            ...(collection.fields || []),
            {
              name: fieldName,
              type: 'array' as const,
              label: 'Tenants',
              admin: {
                description: 'Tenants that have access to this document',
                condition: (data: any, siblingData: any, { user }: any) => {
                  return userHasAccessToAllTenants(user)
                },
              },
              fields: [
                {
                  name: 'tenant',
                  type: 'relationship' as const,
                  relationTo: tenantsSlug,
                  required: true,
                },
              ],
            },
          ],
        }

        // Add access control
        const originalAccess = collection.access || {}

        updatedCollection.access = {
          ...originalAccess,
          create: async (args: any) => {
            const { req } = args

            // Super-admins can create anything
            if (userHasAccessToAllTenants(req.user)) {
              if (typeof originalAccess.create === 'function') {
                return await originalAccess.create(args)
              }
              return originalAccess.create !== undefined ? originalAccess.create : true
            }

            // Regular users - apply original access control
            if (typeof originalAccess.create === 'function') {
              return await originalAccess.create(args)
            }
            return originalAccess.create !== undefined ? originalAccess.create : false
          },

          read: async (args: any) => {
            const { req } = args

            // Super-admins - check for selected tenant cookie
            if (userHasAccessToAllTenants(req.user)) {
              const selectedTenant = getSelectedTenantFromCookie(req, cookieName)

              if (selectedTenant) {
                // Filter by selected tenant
                const filter = {
                  [`${fieldName}.tenant`]: {
                    equals: selectedTenant,
                  },
                }

                // Merge with original access control
                if (typeof originalAccess.read === 'function') {
                  const originalResult = await originalAccess.read(args)
                  if (typeof originalResult === 'object') {
                    return {
                      and: [filter, originalResult],
                    }
                  }
                }

                return filter
              }

              // No tenant selected - return all
              if (typeof originalAccess.read === 'function') {
                return await originalAccess.read(args)
              }
              return originalAccess.read !== undefined ? originalAccess.read : true
            }

            // Regular users - filter by their tenants
            const userTenantIds = extractUserTenantIds(req.user)

            if (userTenantIds.length > 0) {
              const filter = {
                [`${fieldName}.tenant`]: {
                  in: userTenantIds,
                },
              }

              // Merge with original access control
              if (typeof originalAccess.read === 'function') {
                const originalResult = await originalAccess.read(args)
                if (typeof originalResult === 'object') {
                  return {
                    and: [filter, originalResult],
                  }
                }
              }

              return filter
            }

            // No tenants - deny access
            return false
          },

          update: async (args: any) => {
            const { req } = args

            // Super-admins - check for selected tenant cookie
            if (userHasAccessToAllTenants(req.user)) {
              const selectedTenant = getSelectedTenantFromCookie(req, cookieName)

              if (selectedTenant) {
                const filter = {
                  [`${fieldName}.tenant`]: {
                    equals: selectedTenant,
                  },
                }

                if (typeof originalAccess.update === 'function') {
                  const originalResult = await originalAccess.update(args)
                  if (typeof originalResult === 'object') {
                    return {
                      and: [filter, originalResult],
                    }
                  }
                }

                return filter
              }

              // No tenant selected - return all
              if (typeof originalAccess.update === 'function') {
                return await originalAccess.update(args)
              }
              return originalAccess.update !== undefined ? originalAccess.update : true
            }

            // Regular users - filter by their tenants
            const userTenantIds = extractUserTenantIds(req.user)

            if (userTenantIds.length > 0) {
              const filter = {
                [`${fieldName}.tenant`]: {
                  in: userTenantIds,
                },
              }

              if (typeof originalAccess.update === 'function') {
                const originalResult = await originalAccess.update(args)
                if (typeof originalResult === 'object') {
                  return {
                    and: [filter, originalResult],
                  }
                }
              }

              return filter
            }

            return false
          },

          delete: async (args: any) => {
            const { req } = args

            // Super-admins - check for selected tenant cookie
            if (userHasAccessToAllTenants(req.user)) {
              const selectedTenant = getSelectedTenantFromCookie(req, cookieName)

              if (selectedTenant) {
                const filter = {
                  [`${fieldName}.tenant`]: {
                    equals: selectedTenant,
                  },
                }

                if (typeof originalAccess.delete === 'function') {
                  const originalResult = await originalAccess.delete(args)
                  if (typeof originalResult === 'object') {
                    return {
                      and: [filter, originalResult],
                    }
                  }
                }

                return filter
              }

              // No tenant selected - return all
              if (typeof originalAccess.delete === 'function') {
                return await originalAccess.delete(args)
              }
              return originalAccess.delete !== undefined ? originalAccess.delete : true
            }

            // Regular users - filter by their tenants
            const userTenantIds = extractUserTenantIds(req.user)

            if (userTenantIds.length > 0) {
              const filter = {
                [`${fieldName}.tenant`]: {
                  in: userTenantIds,
                },
              }

              if (typeof originalAccess.delete === 'function') {
                const originalResult = await originalAccess.delete(args)
                if (typeof originalResult === 'object') {
                  return {
                    and: [filter, originalResult],
                  }
                }
              }

              return filter
            }

            return false
          },
        }

        return updatedCollection
      })
    }

    return config
  }
}
