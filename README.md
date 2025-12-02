# @kreatika/payload-multitenant

Multi-tenant plugin for **Payload CMS 3.x** with **React 19** and **Next.js 15** support.

A production-ready alternative to the official `@payloadcms/plugin-multi-tenant` that is fully compatible with React 19 and Next.js 15.

## Features

✅ **React 19 + Next.js 15 Compatible** - Works flawlessly with the latest versions
✅ **Cookie-Based Tenant Filtering** - Super-admins can filter data by tenant in the admin UI
✅ **Automatic Access Control** - Role-based permissions for multi-tenant data
✅ **Tenant Dropdown Component** - Beautiful UI component for tenant selection
✅ **4-Level Cookie Parsing** - Reliable cookie access in Payload 3.x environment
✅ **TypeScript** - Fully typed for excellent DX
✅ **Zero Dependencies** - Only peer dependencies on Payload, React, and Next.js

## Installation

```bash
npm install @kreatika/payload-multitenant
# or
yarn add @kreatika/payload-multitenant
# or
pnpm add @kreatika/payload-multitenant
```

## Quick Start

### 1. Add Tenants Collection

Create a `Tenants` collection in your Payload config:

```typescript
// collections/Tenants.ts
import type { CollectionConfig } from 'payload'
import { getTenantFilterOptions } from '@kreatika/payload-multitenant'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Customize based on your needs
    create: ({ req }) => req.user?.role === 'super-admin',
    update: ({ req }) => req.user?.role === 'super-admin',
    delete: ({ req }) => req.user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
  ],
}
```

### 2. Update Users Collection

Add tenant assignments to your Users collection:

```typescript
// collections/Users.ts
import type { CollectionConfig } from 'payload'
import { getTenantFilterOptions } from '@kreatika/payload-multitenant'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Tenant Admin', value: 'tenant-admin' },
        { label: 'Tenant User', value: 'tenant-user' },
      ],
    },
    {
      name: 'tenants',
      type: 'array',
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          relationTo: 'tenants',
          required: true,
          filterOptions: getTenantFilterOptions(),
        },
      ],
    },
  ],
}
```

### 3. Add Tenant Dropdown to Admin UI

In your `payload.config.ts`:

```typescript
import { buildConfig } from 'payload'

export default buildConfig({
  admin: {
    components: {
      beforeNavLinks: ['@kreatika/payload-multitenant#TenantDropdown'],
    },
  },
  // ... rest of config
})
```

### 4. Add Multi-Tenant Access Control to Collections

Example for a `Pages` collection:

```typescript
// collections/Pages.ts
import type { CollectionConfig } from 'payload'
import {
  getSelectedTenantFromCookie,
  getUserTenantIds,
  getTenantFilterOptions,
} from '@kreatika/payload-multitenant'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: async ({ req }) => {
      const { user, payload } = req

      // Super-admins can filter by selected tenant
      if (user?.role === 'super-admin') {
        const selectedTenant = getSelectedTenantFromCookie(req)
        if (selectedTenant) {
          return {
            tenant: {
              equals: selectedTenant,
            },
          }
        }
        return true // No filter = see all
      }

      // Tenant users only see their tenant's pages
      if (user?.id) {
        const tenantIds = await getUserTenantIds(user.id, payload)
        if (tenantIds.length > 0) {
          return {
            tenant: {
              in: tenantIds,
            },
          }
        }
      }

      return false
    },
    create: ({ req: { user } }) => {
      return Boolean(user && user.tenants && user.tenants.length > 0)
    },
    update: async ({ req }) => {
      // Same as read access
    },
    delete: async ({ req }) => {
      // Same as read access
    },
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        position: 'sidebar',
      },
      filterOptions: getTenantFilterOptions(),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    // ... other fields
  ],
}
```

## API Reference

### Helper Functions

#### `getSelectedTenantFromCookie(req, cookieName?)`

Retrieves the selected tenant ID from cookie using a 4-level fallback strategy.

**Parameters:**
- `req` - Payload request object
- `cookieName` (optional) - Cookie name (default: `'payload-selected-tenant'`)

**Returns:** `number | string | null`

#### `getUserTenantIds(userId, payload)`

Gets all tenant IDs assigned to a user.

**Parameters:**
- `userId` - User ID
- `payload` - Payload instance

**Returns:** `Promise<(number | string)[]>`

#### `getTenantFilterOptions()`

Returns filterOptions function for tenant relationship fields in admin UI.

**Returns:** Filter function that restricts tenant selection based on user role

#### `extractTenantId(tenant)`

Extracts tenant ID from various formats (number, string, object).

**Parameters:**
- `tenant` - Tenant data in any format

**Returns:** `number | string | null`

#### `getUserIdsForTenants(tenantIds, payload)`

Gets all user IDs that belong to specific tenants.

**Parameters:**
- `tenantIds` - Array of tenant IDs
- `payload` - Payload instance

**Returns:** `Promise<(number | string)[]>`

### Components

#### `TenantDropdown`

React component that displays a tenant filter dropdown in the admin sidebar (only visible to super-admins).

**Features:**
- Automatic cookie management
- Active state styling
- Reset button
- Full sidebar width
- PayloadCMS design system integration

## How It Works

This plugin solves the challenge of accessing cookies in Payload CMS 3.x with Next.js 15 through a **4-level fallback strategy**:

1. **req.context** - Checks if set by hooks
2. **req.headers.cookie** - Standard Node.js method
3. **req.cookies** - Cookies object
4. **req.headers.get('cookie')** - Next.js Headers API ✅ **This works!**

The selected tenant is stored in a cookie and parsed in access control functions to filter data dynamically.

## Requirements

- Payload CMS >= 3.0.0
- React >= 19.0.0
- Next.js >= 15.0.0
- Node.js >= 18.0.0

## License

MIT

## Author

**Maximilian A. Grimm**
KREATIKA
📧 grimm@kreatika.de
🌐 https://kreatika.de

## Support

For issues and questions, please open an issue on https://github.com/grimmcreative/payload-kreatika-multitenant.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.
