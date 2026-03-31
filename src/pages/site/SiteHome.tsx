import PublicLayout from "@/components/PublicLayout";
import { useWebsite } from "@/contexts/WebsiteContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plane, MapPin, CreditCard, Shield, Star } from "lucide-react";

const services = [
  { icon: Plane, title: "Tour Packages", desc: "Curated domestic and international tour packages" },
  { icon: MapPin, title: "Hotel Booking", desc: "Best deals on hotels and resorts worldwide" },
  { icon: CreditCard, title: "Flight Tickets", desc: "Domestic and international flight bookings" },
  { icon: Shield, title: "Visa Assistance", desc: "Hassle-free visa processing for all countries" },
];

const SiteHome = () => {
  const { tenant, packages } = useWebsite();
  const featured = packages.slice(0, 3);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative bg-primary/5 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Explore the World with<br />
            <span className="text-primary">{tenant.name}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {tenant.description}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/site/packages"><Button size="lg">View Packages</Button></Link>
            <Link to="/site/contact"><Button size="lg" variant="outline">Contact Us</Button></Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Card key={s.title} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <s.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Featured Packages</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-primary/10 flex items-center justify-center">
                  <Plane className="h-16 w-16 text-primary/30" />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-semibold text-primary">{pkg.type}</span>
                    <span className="text-xs text-muted-foreground">{pkg.duration}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">৳{pkg.price.toLocaleString()}</span>
                    <Link to="/site/contact"><Button size="sm">Book Now</Button></Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/site/packages"><Button variant="outline">View All Packages</Button></Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-10">Why Choose Us</h2>
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {[
              { icon: Star, title: "500+ Happy Travelers", desc: "Trusted by hundreds of satisfied customers" },
              { icon: Shield, title: "Licensed & Verified", desc: "Fully licensed travel agency with verified partners" },
              { icon: CreditCard, title: "Best Price Guarantee", desc: "Competitive pricing with no hidden charges" },
            ].map((item) => (
              <div key={item.title} className="space-y-2">
                <item.icon className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default SiteHome;
