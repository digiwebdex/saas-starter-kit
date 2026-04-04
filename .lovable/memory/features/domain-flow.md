---
name: Custom Domain Flow
description: Full domain management with Prisma model, backend routes, audit logging, duplicate prevention, primary domain, plan limits
type: feature
---
## Domain Flow (Phase 2)

### Prisma Model: TenantDomain
- Fields: domain (unique), tenantId, wwwRedirect, status, sslStatus, verificationStatus, verificationToken, isPrimary
- Cascade delete with Tenant

### Backend: /api/admin/domains (super_admin only)
- GET / — list all with tenant info
- POST / — add with duplicate check, plan limit check, auto-generates verification token
- POST /:id/verify — server-side DNS TXT verification via Google DNS-over-HTTPS
- PATCH /:id/ssl — update SSL status
- PATCH /:id/status — activate/deactivate (requires verified)
- PATCH /:id/primary — set primary, unsets others for same tenant
- DELETE /:id — remove domain

### Audit Logging
- All domain actions logged to AuditLog table (create, verify, activate, deactivate, set_primary, delete)

### Frontend: domainApi in api.ts
- AdminDomains.tsx uses real API, no mock data
- Tenants loaded from adminApi.getTenants()

### Tenant Slug
- Auto-generated on registration from tenant name
- Unique constraint in Prisma
- Used for subdomain system
