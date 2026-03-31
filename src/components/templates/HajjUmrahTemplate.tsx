import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebsite } from "@/contexts/WebsiteContext";
import type { WebsiteConfig } from "@/lib/websiteApi";
import { Moon, Star, Plane, Shield, MapPin, Hotel } from "lucide-react";

const iconMap: Record<string, React.ElementType> = { Moon, Star, Plane, Shield, MapPin, Hotel };

export default function HajjUmrahTemplate({ config }: { config: WebsiteConfig }) {
  const { tenant, packages } = useWebsite();
  const featured = packages.slice(0, 3);
  const c = config.colors;

  return (
    <div style={{ backgroundColor: `hsl(${c.background})`, color: `hsl(${c.text})` }}>
      {/* Hero with Islamic pattern feel */}
      <section className="py-20 md:py-32 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, hsl(${c.primary}), transparent 50%), radial-gradient(circle at 75% 50%, hsl(${c.accent}), transparent 50%)`,
          }}
        />
        <div className="container mx-auto px-4 relative">
          <Moon className="h-16 w-16 mx-auto mb-6" style={{ color: `hsl(${c.accent})` }} />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            {config.content.heroTitle}
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
      <section className="py-16" style={{ backgroundColor: `hsl(${c.secondary})` }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {config.content.services.map((s, i) => {
              const Icon = iconMap[s.icon] || Moon;
              return (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow border-none shadow-md">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `hsl(${c.primary} / 0.1)` }}>
                      <Icon className="h-8 w-8" style={{ color: `hsl(${c.primary})` }} />
                    </div>
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
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Featured Packages</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(${c.primary} / 0.15), hsl(${c.accent} / 0.15))` }}>
                    <Moon className="h-16 w-16" style={{ color: `hsl(${c.primary} / 0.4)` }} />
                  </div>
                  <CardContent className="p-5">
                    <span className="text-xs uppercase font-semibold" style={{ color: `hsl(${c.primary})` }}>{pkg.type}</span>
                    <h3 className="font-bold text-lg mt-1 mb-1">{pkg.name}</h3>
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
