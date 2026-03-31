import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebsite } from "@/contexts/WebsiteContext";
import type { WebsiteConfig } from "@/lib/websiteApi";
import { Mountain, Palmtree, Building, Camera, Star, Plane, MapPin, TreePine } from "lucide-react";

const iconMap: Record<string, React.ElementType> = { Mountain, Palmtree, Building, Camera, Star, Plane, MapPin, TreePine };

export default function TourPackagesTemplate({ config }: { config: WebsiteConfig }) {
  const { tenant, packages } = useWebsite();
  const featured = packages.slice(0, 6);
  const c = config.colors;

  return (
    <div style={{ backgroundColor: `hsl(${c.background})`, color: `hsl(${c.text})` }}>
      {/* Hero with gradient */}
      <section
        className="py-24 md:py-36 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${c.primary}), hsl(${c.accent}))`,
          color: "white",
        }}
      >
        <div className="container mx-auto px-4 relative">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">🌍 {packages.length}+ Destinations</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            {config.content.heroTitle}
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-90">{config.content.heroSubtitle}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/site/packages">
              <Button size="lg" className="bg-white hover:bg-white/90" style={{ color: `hsl(${c.primary})` }}>Explore Tours</Button>
            </Link>
            <Link to="/site/contact">
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">Get in Touch</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">What We Offer</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {config.content.services.map((s, i) => {
              const Icon = iconMap[s.icon] || Mountain;
              return (
                <div key={i} className="text-center p-6 rounded-2xl transition-all hover:shadow-lg" style={{ backgroundColor: `hsl(${c.secondary})` }}>
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(${c.primary}), hsl(${c.accent}))` }}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm opacity-60">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      {featured.length > 0 && (
        <section className="py-16" style={{ backgroundColor: `hsl(${c.secondary})` }}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Popular Tours</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                  <div
                    className="h-52 flex items-center justify-center relative"
                    style={{ background: `linear-gradient(135deg, hsl(${c.primary} / 0.2), hsl(${c.accent} / 0.2))` }}
                  >
                    <Mountain className="h-16 w-16" style={{ color: `hsl(${c.primary} / 0.3)` }} />
                    <Badge className="absolute top-3 left-3" style={{ backgroundColor: `hsl(${c.accent})`, color: "white" }}>
                      {pkg.type}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-xs opacity-50 mb-1">{pkg.duration}</p>
                    <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                    <p className="text-sm opacity-60 mb-4 line-clamp-2">{pkg.description}</p>
                    {pkg.highlights?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pkg.highlights.slice(0, 3).map((h) => (
                          <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs opacity-50">Starting from</span>
                        <p className="text-xl font-bold" style={{ color: `hsl(${c.primary})` }}>৳{pkg.price.toLocaleString()}</p>
                      </div>
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
