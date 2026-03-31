// Website customization API
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface WebsiteConfig {
  id?: string;
  tenantId?: string;
  template: "travel-agency" | "hajj-umrah" | "tour-packages";
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  content: {
    heroTitle: string;
    heroSubtitle: string;
    aboutTitle: string;
    aboutText: string;
    services: { icon: string; title: string; desc: string }[];
    footerText: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

// Default configs per template
export const templateDefaults: Record<string, WebsiteConfig> = {
  "travel-agency": {
    template: "travel-agency",
    colors: {
      primary: "221 83% 53%",
      secondary: "210 40% 96%",
      accent: "25 95% 53%",
      background: "0 0% 100%",
      text: "222 47% 11%",
    },
    content: {
      heroTitle: "Explore the World With Us",
      heroSubtitle: "Your trusted partner for unforgettable travel experiences across the globe.",
      aboutTitle: "About Our Agency",
      aboutText: "We are a full-service travel agency dedicated to creating memorable journeys for our clients.",
      services: [
        { icon: "Plane", title: "Flight Booking", desc: "Best deals on domestic & international flights" },
        { icon: "Hotel", title: "Hotel Reservation", desc: "Premium hotels at competitive prices" },
        { icon: "Map", title: "Tour Packages", desc: "Curated tours for every budget" },
        { icon: "Shield", title: "Visa Assistance", desc: "Hassle-free visa processing" },
      ],
      footerText: "Your journey begins here.",
    },
  },
  "hajj-umrah": {
    template: "hajj-umrah",
    colors: {
      primary: "142 71% 45%",
      secondary: "140 30% 96%",
      accent: "45 93% 47%",
      background: "0 0% 100%",
      text: "222 47% 11%",
    },
    content: {
      heroTitle: "Your Sacred Journey Starts Here",
      heroSubtitle: "Trusted Hajj & Umrah packages with complete guidance and support.",
      aboutTitle: "About Our Services",
      aboutText: "We provide comprehensive Hajj and Umrah services with decades of experience guiding pilgrims.",
      services: [
        { icon: "Moon", title: "Hajj Packages", desc: "Complete Hajj packages with 5-star accommodation" },
        { icon: "Star", title: "Umrah Packages", desc: "Year-round Umrah with flexible dates" },
        { icon: "Plane", title: "Flight & Transfer", desc: "Direct flights and airport transfers" },
        { icon: "Shield", title: "Visa & Documentation", desc: "Full visa processing support" },
      ],
      footerText: "Serving pilgrims with dedication and trust.",
    },
  },
  "tour-packages": {
    template: "tour-packages",
    colors: {
      primary: "262 83% 58%",
      secondary: "260 30% 96%",
      accent: "340 82% 52%",
      background: "0 0% 100%",
      text: "222 47% 11%",
    },
    content: {
      heroTitle: "Discover Amazing Destinations",
      heroSubtitle: "Handcrafted tour packages for adventure seekers and leisure travelers.",
      aboutTitle: "Why Choose Our Tours",
      aboutText: "We craft unique travel experiences that combine adventure, culture, and comfort.",
      services: [
        { icon: "Mountain", title: "Adventure Tours", desc: "Thrilling adventures in stunning locations" },
        { icon: "Palmtree", title: "Beach Holidays", desc: "Relaxing beach getaways worldwide" },
        { icon: "Building", title: "City Breaks", desc: "Explore the world's greatest cities" },
        { icon: "Camera", title: "Photography Tours", desc: "Capture breathtaking moments" },
      ],
      footerText: "Adventure awaits around every corner.",
    },
  },
};

export const websiteApi = {
  getConfig: async (): Promise<WebsiteConfig> => {
    try {
      const res = await fetch(`${BASE_URL}/website/config`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      return res.json();
    } catch {
      return templateDefaults["travel-agency"];
    }
  },

  saveConfig: async (config: WebsiteConfig): Promise<WebsiteConfig> => {
    const res = await fetch(`${BASE_URL}/website/config`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to save");
    return res.json();
  },

  getPublicConfig: async (slug: string): Promise<WebsiteConfig> => {
    try {
      const res = await fetch(`${BASE_URL}/public/${slug}/website`);
      if (!res.ok) throw new Error();
      return res.json();
    } catch {
      return templateDefaults["travel-agency"];
    }
  },

  getPublicConfigByDomain: async (domain: string): Promise<WebsiteConfig> => {
    try {
      const res = await fetch(`${BASE_URL}/public/domain/${domain}/website`);
      if (!res.ok) throw new Error();
      return res.json();
    } catch {
      return templateDefaults["travel-agency"];
    }
  },
};
