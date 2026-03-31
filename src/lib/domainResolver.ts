// Domain Resolution Middleware — detects tenant from hostname
import { publicApi, type TenantPublic } from "./publicApi";

export interface DomainResolution {
  type: "slug" | "custom-domain" | "main-app" | "unknown";
  slug?: string;
  customDomain?: string;
  hostname: string;
}

const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || "";

/**
 * Resolve tenant identity from the current hostname.
 * Supports:
 *   - Subdomains: {slug}.yourdomain.com
 *   - Root domain: yourdomain.com (main app)
 *   - www subdomain: www.yourdomain.com (main app)
 *   - Custom domains: example.com → lookup by domain
 *   - Localhost / preview: main app
 */
export function resolveHostname(): DomainResolution {
  const hostname = window.location.hostname.toLowerCase();

  // Dev / preview environments → main app
  if (!APP_DOMAIN || hostname === "localhost" || hostname.includes("lovable.app") || hostname === "127.0.0.1") {
    return { type: "main-app", hostname };
  }

  // Strip www for comparison
  const bare = hostname.replace(/^www\./, "");
  const bareDomain = APP_DOMAIN.replace(/^www\./, "");

  // Main app domain (root or www)
  if (bare === bareDomain) {
    return { type: "main-app", hostname };
  }

  // Subdomain of app domain → extract slug
  if (bare.endsWith(`.${bareDomain}`)) {
    const slug = bare.replace(`.${bareDomain}`, "");
    if (slug && !slug.includes(".")) {
      return { type: "slug", slug, hostname };
    }
  }

  // Everything else → custom domain (strip www for matching)
  const customDomain = hostname.replace(/^www\./, "");
  return { type: "custom-domain", customDomain, hostname };
}

/**
 * Fetch tenant data based on domain resolution.
 * Returns null if tenant not found (show error page).
 */
export async function fetchTenantByDomain(
  resolution: DomainResolution
): Promise<{ tenant: TenantPublic | null; error?: string }> {
  try {
    if (resolution.type === "slug" && resolution.slug) {
      const tenant = await publicApi.getTenant(resolution.slug);
      return { tenant };
    }

    if (resolution.type === "custom-domain" && resolution.customDomain) {
      const tenant = await publicApi.getTenantByDomain(resolution.customDomain);
      return { tenant };
    }

    return { tenant: null, error: "No tenant identifier found" };
  } catch (err: any) {
    console.error("[DomainResolver] Tenant lookup failed:", err);
    return { tenant: null, error: err.message || "Tenant not found" };
  }
}

/**
 * Full resolution: detect domain + fetch tenant in one call.
 */
export async function resolveTenant(): Promise<{
  resolution: DomainResolution;
  tenant: TenantPublic | null;
  error?: string;
}> {
  const resolution = resolveHostname();

  if (resolution.type === "main-app") {
    return { resolution, tenant: null };
  }

  const { tenant, error } = await fetchTenantByDomain(resolution);
  return { resolution, tenant, error };
}
