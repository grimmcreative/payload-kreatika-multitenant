/**
 * Multi-tenant helper functions for Payload CMS 3.x + Next.js 15
 *
 * @package @kreatika/payload-multitenant
 * @author Maximilian A. Grimm <grimm@kreatika.de>
 * @license MIT
 */

import type { PayloadRequest } from 'payload'

/**
 * Get the selected tenant ID from cookie using 4-level fallback strategy
 * This is the ONLY reliable method in Payload 3.x + Next.js 15
 *
 * @param req - Payload request object
 * @param cookieName - Name of the tenant selection cookie (default: 'payload-selected-tenant')
 * @returns Tenant ID (number or string) or null if not found
 */
export const getSelectedTenantFromCookie = (
  req: any,
  cookieName: string = 'payload-selected-tenant'
): number | string | null => {
  try {
    // Method 1: Check req.context first (if set by hooks)
    if (req?.context?.selectedTenant !== undefined) {
      return req.context.selectedTenant
    }

    // Method 2: Parse from headers.cookie (standard Node.js)
    if (req?.headers?.cookie) {
      const cookies = req.headers.cookie.split(';')
      const tenantCookie = cookies.find((c: string) =>
        c.trim().startsWith(`${cookieName}=`),
      )
      if (tenantCookie) {
        const value = tenantCookie.split('=')[1]?.trim()
        if (value && value !== 'all') {
          const numValue = parseInt(value, 10)
          return isNaN(numValue) ? value : numValue
        }
      }
    }

    // Method 3: Check req.cookies object
    if (req?.cookies?.[cookieName]) {
      const value = req.cookies[cookieName]
      if (value !== 'all') {
        const numValue = parseInt(value, 10)
        return isNaN(numValue) ? value : numValue
      }
    }

    // Method 4: Try headers.get (Next.js Headers API) - THIS WORKS in Payload 3.x!
    if (req?.headers?.get) {
      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';')
        const tenantCookie = cookies.find((c: string) =>
          c.trim().startsWith(`${cookieName}=`),
        )
        if (tenantCookie) {
          const value = tenantCookie.split('=')[1]?.trim()
          if (value && value !== 'all') {
            const numValue = parseInt(value, 10)
            return isNaN(numValue) ? value : numValue
          }
        }
      }
    }
  } catch (error) {
    // Silent fail - cookie parsing should never break the application
  }

  return null
}

/**
 * Extract tenant ID from various formats (number, string, object with id field)
 *
 * @param tenant - Tenant data in any format
 * @returns Tenant ID or null
 */
export const extractTenantId = (tenant: any): number | string | null => {
  if (!tenant) return null
  if (typeof tenant === 'number') return tenant
  if (typeof tenant === 'string') return tenant
  if (typeof tenant === 'object') {
    const id = tenant.id ?? tenant._id ?? tenant.ID
    if (id !== undefined && id !== null) {
      return id
    }
  }
  return null
}

/**
 * Get all tenant IDs assigned to a user by querying the database
 *
 * @param userId - User ID
 * @param payload - Payload instance
 * @returns Array of tenant IDs
 */
export const getUserTenantIds = async (
  userId: number | string,
  payload: any,
): Promise<(number | string)[]> => {
  try {
    const userDoc = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 2,
    })

    if (userDoc && userDoc.tenants && Array.isArray(userDoc.tenants)) {
      const tenantIds = userDoc.tenants
        .map((t: any) => extractTenantId(t.tenant))
        .filter((id): id is number | string => id !== null)
      return tenantIds
    }
  } catch (error) {
    // Silent fail - return empty array
  }
  return []
}

/**
 * Standard filterOptions for tenant relationship fields in admin UI
 * Restricts tenant selection based on user role and assignments
 *
 * @returns Filter function for Payload admin UI
 */
export const getTenantFilterOptions = () => {
  return async ({ user, req }: any) => {
    // Super-admins see all tenants
    if (user?.role === 'super-admin') {
      return true
    }

    // For tenant admins and users, query their assigned tenants from the database
    if (user?.id) {
      const tenantIds = await getUserTenantIds(user.id, req.payload)

      if (tenantIds.length > 0) {
        return {
          id: {
            in: tenantIds,
          },
        }
      }
    }

    return false
  }
}

/**
 * Get all user IDs that belong to specific tenants
 * Useful for filtering users by tenant in access control
 *
 * @param tenantIds - Array of tenant IDs to filter by
 * @param payload - Payload instance
 * @returns Array of user IDs
 */
export const getUserIdsForTenants = async (
  tenantIds: (number | string)[],
  payload: any,
): Promise<(number | string)[]> => {
  try {
    if (tenantIds.length === 0) return []

    const users = await payload.find({
      collection: 'users',
      depth: 2,
      limit: 1000,
    })

    const userIds: (number | string)[] = []

    if (users.docs && Array.isArray(users.docs)) {
      for (const user of users.docs) {
        if (user.tenants && Array.isArray(user.tenants)) {
          const userTenantIds = user.tenants
            .map((t: any) => extractTenantId(t.tenant))
            .filter((id): id is number | string => id !== null)

          const hasMatchingTenant = userTenantIds.some((id) => tenantIds.includes(id))
          if (hasMatchingTenant) {
            userIds.push(user.id)
          }
        }
      }
    }

    return userIds
  } catch (error) {
    return []
  }
}
