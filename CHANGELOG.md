# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-02

### Added
- Initial release of @kreatika/payload-multitenant
- Multi-tenant support for Payload CMS 3.x with React 19 and Next.js 15
- Cookie-based tenant filtering with 4-level fallback strategy
- `getSelectedTenantFromCookie()` helper function
- `getUserTenantIds()` helper function
- `getTenantFilterOptions()` helper function
- `extractTenantId()` helper function
- `getUserIdsForTenants()` helper function
- `TenantDropdown` React component for admin UI
- Comprehensive TypeScript types
- Full documentation and examples
- MIT License

### Features
- ✅ React 19 + Next.js 15 compatible
- ✅ Automatic access control patterns
- ✅ Beautiful tenant dropdown UI component
- ✅ Zero dependencies (except peer deps)
- ✅ Fully typed with TypeScript
- ✅ Production-ready alternative to official plugin

---

**Developed by KREATIKA**
Maximilian A. Grimm - grimm@kreatika.de
