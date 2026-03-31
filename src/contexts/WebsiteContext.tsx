import { createContext, useContext, useState, useEffect } from "react";
import { publicApi, type TenantPublic, type PackagePublic } from "@/lib/publicApi";

// Demo fallback
const demoTenant: TenantPublic = {
  id: "demo",
  name: "Skyline Travel & Tours",
  slug: "skyline",
  description: "Your trusted partner for unforgettable travel experiences. We specialize in curated tours, flight bookings, hotel reservations, and visa assistance across the globe.",
  phone: "+880 1234-567890",
  email: "info@skylinetravel.com",
  address: "123 Travel Plaza, Suite 400, Dhaka, Bangladesh",
  website: "https://skylinetravel.com",
  socialLinks: { facebook: "#", instagram: "#", twitter: "#" },
};

const demoPackages: PackagePublic[] = [
  { id: "1", name: "Cox's Bazar Beach Getaway", description: "3 days of sun, sand, and relaxation at the world's longest beach.", price: 15000, duration: "3 Days / 2 Nights", type: "tour", image: "", highlights: ["Beach resort stay", "Seafood dinner", "Boat ride", "Airport transfer"] },
  { id: "2", name: "Bangkok & Pattaya Explorer", description: "Explore vibrant Thailand with guided city tours and island hopping.", price: 45000, duration: "5 Days / 4 Nights", type: "tour", image: "", highlights: ["City tour", "Coral Island trip", "Thai cooking class", "Night market"] },
  { id: "3", name: "Dubai Luxury Package", description: "Experience the grandeur of Dubai with desert safari and Burj Khalifa visit.", price: 85000, duration: "4 Days / 3 Nights", type: "tour", image: "", highlights: ["Desert safari", "Burj Khalifa", "Dubai Mall", "Dhow cruise dinner"] },
  { id: "4", name: "Malaysia Visa Processing", description: "Fast-track visa processing for Malaysia with document assistance.", price: 5000, duration: "5-7 Working Days", type: "visa", image: "", highlights: ["Document review", "Application filing", "Status tracking", "Express option"] },
  { id: "5", name: "Dhaka to Bangkok Flight", description: "Round-trip economy class tickets with flexible dates.", price: 28000, duration: "Round Trip", type: "ticket", image: "", highlights: ["20kg baggage", "Meal included", "Flexible dates", "Insurance option"] },
  { id: "6", name: "Maldives Honeymoon", description: "Romantic overwater villa stay in the Maldives paradise.", price: 150000, duration: "5 Days / 4 Nights", type: "hotel", image: "", highlights: ["Overwater villa", "Couple spa", "Sunset cruise", "All-inclusive meals"] },
];

/**
 * Resolves tenant identifier from the current hostname.
 *
 * Supports three patterns:
 *   1. Subdomain:    acme.yourapp.com   → slug "acme"
 *   2. Custom domain: acme-travel.com   → full hostname passed to API
 *   3. Localhost/dev: falls back to demo data
 */
function resolveTenantFromHostname(): { slug?: string; customDomain?: string } {
  const hostname = window.location.hostname;
  const appDomain = import.meta.env.VITE_APP_DOMAIN || ""; // e.g. "yourapp.com"

  // Local / preview → demo
  if (!appDomain || hostname === "localhost" || hostname.includes("lovable.app")) {
    return {};
  }

  // Subdomain pattern: {slug}.yourapp.com
  if (hostname.endsWith(`.${appDomain}`) && hostname !== appDomain && hostname !== `www.${appDomain}`) {
    const slug = hostname.replace(`.${appDomain}`, "");
    return { slug };
  }

  // Custom domain (not matching app domain at all)
  if (hostname !== appDomain && hostname !== `www.${appDomain}`) {
    return { customDomain: hostname };
  }

  return {};
}

interface WebsiteContextType {
  tenant: TenantPublic;
  packages: PackagePublic[];
  loading: boolean;
}

const WebsiteContext = createContext<WebsiteContextType>({
  tenant: demoTenant,
  packages: demoPackages,
  loading: false,
});

export const useWebsite = () => useContext(WebsiteContext);

export const WebsiteProvider = ({ slug: propSlug, children }: { slug?: string; children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<TenantPublic>(demoTenant);
  const [packages, setPackages] = useState<PackagePublic[]>(demoPackages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { slug: domainSlug, customDomain } = resolveTenantFromHostname();
    const identifier = propSlug || domainSlug;

    if (identifier) {
      // Resolve by slug (subdomain or prop)
      setLoading(true);
      Promise.all([
        publicApi.getTenant(identifier),
        publicApi.getPackages(identifier),
      ])
        .then(([t, p]) => { setTenant(t); setPackages(p); })
        .catch(() => { /* keep demo data on error */ })
        .finally(() => setLoading(false));
    } else if (customDomain) {
      // Resolve by custom domain
      setLoading(true);
      Promise.all([
        publicApi.getTenantByDomain(customDomain),
        publicApi.getPackagesByDomain(customDomain),
      ])
        .then(([t, p]) => { setTenant(t); setPackages(p); })
        .catch(() => { /* keep demo data on error */ })
        .finally(() => setLoading(false));
    }
  }, [propSlug]);

  return (
    <WebsiteContext.Provider value={{ tenant, packages, loading }}>
      {children}
    </WebsiteContext.Provider>
  );
};
