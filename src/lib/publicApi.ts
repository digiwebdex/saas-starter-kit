// Public API — no auth required, fetches tenant data by slug
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function publicRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export interface TenantPublic {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  socialLinks?: { facebook?: string; instagram?: string; twitter?: string };
}

export interface PackagePublic {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  image?: string;
  type: string;
  highlights: string[];
}

export const publicApi = {
  getTenant: (slug: string) => publicRequest<TenantPublic>(`/public/${slug}`),
  getPackages: (slug: string) => publicRequest<PackagePublic[]>(`/public/${slug}/packages`),
  getTenantByDomain: (domain: string) => publicRequest<TenantPublic>(`/public/domain/${domain}`),
  getPackagesByDomain: (domain: string) => publicRequest<PackagePublic[]>(`/public/domain/${domain}/packages`),
};
