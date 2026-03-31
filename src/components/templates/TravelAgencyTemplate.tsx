import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebsite } from "@/contexts/WebsiteContext";
import type { WebsiteConfig } from "@/lib/websiteApi";
import { Plane, MapPin, CreditCard, Shield, Star, Hotel, Map } from "lucide-react";

const iconMap: Record<string, React.ElementType> = { Plane, MapPin, CreditCard, Shield, Star, Hotel, Map };

export default function TravelAgencyTemplate({ config }: { config: WebsiteConfig }) {
  const { tenant, packages } = useWebsite();
  const featured = packages.slice(0, 3);
  const c = config.colors;

  return (
    <div style={{ backgroundColor: `hsl(${c.background})`, color: `hsl(${c.text})` }}>
      {/* Hero */}
      <section className="py-20 md:py-32 text-center" style={{ backgroundColor: `hsl(${c.primary} / 0.08)` }}>
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            {config.content.heroTitle.includes("{name}") 
              ? config.content.heroTitle.replace("{name}", tenant.name) 
              : config.content.heroTitle}
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-70">{config.content.heroSubtitle}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/site/packages">
              <Button size="lg" style={{ backgroundColor: `hsl(${c.primary})`, color: "white" }}>View Packages</Button>
            </Link>
            <Link to="/site/contact">
              <Button size="lg" variant="outline" style={{ borderColor: `hsl(${c.primary})`, color: `hsl(${c.primary})` }}>Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {config.content.services.map((s, i) => {
              const Icon = iconMap[s.icon] || Plane;
              return (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="h-10 w-10 mx-auto mb-4" style={{ color: `hsl(${c.primary})` }} />
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm opacity-60">{s.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-16" style={{ backgroundColor: `hsl(${c.secondary})` }}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Featured Packages</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 flex items-center justify-center" style={{ backgroundColor: `hsl(${c.primary} / 0.1)` }}>
                    <Plane className="h-16 w-16" style={{ color: `hsl(${c.primary} / 0.3)` }} />
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs uppercase font-semibold" style={{ color: `hsl(${c.primary})` }}>{pkg.type}</span>
                      <span className="text-xs opacity-60">{pkg.duration}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                    <p className="text-sm opacity-60 mb-3">{pkg.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold" style={{ color: `hsl(${c.primary})` }}>৳{pkg.price.toLocaleString()}</span>
                      <Link to="/site/contact"><Button size="sm" style={{ backgroundColor: `hsl(${c.primary})`, color: "white" }}>Book Now</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
