/**
 * @kreatika/payload-multitenant
 *
 * Multi-tenant plugin for Payload CMS 3.x with React 19 and Next.js 15 support
 *
 * @author Maximilian A. Grimm <grimm@kreatika.de>
 * @license MIT
 */

// Export plugin function
export { multiTenantPlugin } from './plugin'
export type { MultiTenantPluginOptions } from './plugin'

// Export helpers
export {
  getSelectedTenantFromCookie,
  extractTenantId,
  getUserTenantIds,
  getTenantFilterOptions,
  getUserIdsForTenants,
} from './lib/helpers'

// Export types
export * from './types'
