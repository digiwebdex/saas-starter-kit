import PublicLayout from "@/components/PublicLayout";
import { useWebsite } from "@/contexts/WebsiteContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Globe, Award, Heart } from "lucide-react";

const SiteAbout = () => {
  const { tenant } = useWebsite();

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">About Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn more about {tenant.name} and our mission to make travel accessible for everyone.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {tenant.name} was founded with a simple mission: to make travel planning effortless and enjoyable. 
            We believe everyone deserves to explore the world, and we work tirelessly to offer the best packages, 
            competitive prices, and exceptional customer service.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            From our humble beginnings, we've grown to serve hundreds of happy travelers across domestic and 
            international destinations. Our team of experienced travel consultants ensures every trip is 
            meticulously planned and executed to perfection.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            {[
              { icon: Users, value: "500+", label: "Happy Travelers" },
              { icon: Globe, value: "25+", label: "Destinations" },
              { icon: Award, value: "5+", label: "Years Experience" },
              { icon: Heart, value: "98%", label: "Satisfaction Rate" },
            ].map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Values</h2>
          <div className="space-y-6">
            {[
              { title: "Customer First", desc: "Every decision we make starts with what's best for our travelers." },
              { title: "Transparency", desc: "No hidden fees, no surprises. What you see is what you pay." },
              { title: "Quality Service", desc: "We partner only with verified hotels, airlines, and tour operators." },
              { title: "Innovation", desc: "Continuously improving our services with modern technology and feedback." },
            ].map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default SiteAbout;
