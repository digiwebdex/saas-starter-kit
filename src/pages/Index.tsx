import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PLANS, FEATURE_COMPARISON, type PlanType } from "@/lib/plans";
import {
  Plane, Globe, Users, CreditCard, BarChart3, Shield, Moon, Receipt,
  Check, X, ArrowRight, Star, Zap, Building2, Phone, Mail, MapPin, Crown, Rocket, Gem,
} from "lucide-react";

/* ───── Plan Icons ───── */
const planIcons: Record<string, React.ElementType> = {
  free: Star,
  basic: Zap,
  pro: Crown,
  business: Rocket,
  enterprise: Gem,
};

/* ───── Features ───── */
const features = [
  { icon: Users, title: "CRM System", desc: "Manage clients, agents, vendors and leads in one place" },
  { icon: Plane, title: "Booking Management", desc: "Handle tour, flight, hotel & visa bookings effortlessly" },
  { icon: Receipt, title: "Invoice & Payments", desc: "Generate invoices, track payments with bKash & SSLCommerz" },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Sales, expense, profit and agent commission reports" },
  { icon: Moon, title: "Hajj & Umrah", desc: "Specialized module for pilgrim management & installments" },
  { icon: Globe, title: "Website Builder", desc: "Custom website with templates for your travel agency" },
  { icon: Shield, title: "Multi-Tenant SaaS", desc: "Each agency gets their own secure, isolated workspace" },
  { icon: CreditCard, title: "Subscription Billing", desc: "Automated billing with multiple payment gateways" },
];

/* ───── Component ───── */
const Index = () => {
  const { toast } = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    website: "",
    employees: "",
    message: "",
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name: form.ownerName,
        email: form.email,
        password: form.password,
        tenantName: form.companyName,
      });
      toast({ title: "Registration Successful!", description: `Welcome to Globex Connect — ${plans.find(p => p.id === selectedPlan)?.name} plan` });
      setDialogOpen(false);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* ───── Navbar ───── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1628]/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/images/og-image.jpg" alt="Globex Connect" className="h-9 rounded" />
            <span className="text-lg font-bold tracking-wide">
              <span className="text-white">GLOBEX</span>{" "}
              <span className="text-cyan-400">CONNECT</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-white/70 hover:text-white transition-colors">Pricing</a>
            <a href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</a>
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 30% 40%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 70% 60%, #0ea5e9 0%, transparent 50%)",
        }} />
        <div className="container mx-auto px-4 text-center relative">
          <Badge className="mb-6 bg-cyan-400/10 text-cyan-400 border-cyan-400/30 text-sm px-4 py-1.5">
            🚀 #1 Travel Agency Software in Bangladesh
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Manage Your Travel<br />
            Agency <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Online</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10">
            Complete SaaS platform for travel agencies — CRM, bookings, invoices, payments,
            reports, Hajj/Umrah management, and your own branded website. All in one place.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#pricing">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 h-12 text-base">
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 h-12 text-base">
                See Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { val: "500+", label: "Travel Agencies" },
              { val: "50K+", label: "Bookings Managed" },
              { val: "99.9%", label: "Uptime" },
              { val: "24/7", label: "Support" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-cyan-400">{s.val}</p>
                <p className="text-sm text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="py-24 bg-[#0d1d35]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              A complete platform built specifically for travel agencies in Bangladesh and beyond.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                  <f.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Choose the plan that fits your agency. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden bg-white/5 border-white/10 text-white ${
                  plan.popular ? "ring-2 ring-cyan-400 border-cyan-400/50 scale-105" : "hover:border-white/20"
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-white/50">{plan.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-extrabold text-cyan-400">৳{plan.price.toLocaleString()}</span>
                    <span className="text-white/50 ml-1">{plan.period}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                        <span className="text-white/70">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-11 ${
                      plan.popular
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                        : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    Subscribe Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Contact ───── */}
      <section id="contact" className="py-24 bg-[#0d1d35]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">Contact</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-white/50">Have questions? We're here to help.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-3xl mx-auto">
            {[
              { icon: Phone, label: "Phone", value: "+880 1234-567890" },
              { icon: Mail, label: "Email", value: "support@globexconnect.com" },
              { icon: MapPin, label: "Office", value: "Dhaka, Bangladesh" },
            ].map((c) => (
              <div key={c.label} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                <c.icon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                <p className="font-semibold mb-1">{c.label}</p>
                <p className="text-sm text-white/50">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-6 w-6 text-cyan-400" />
                <span className="font-bold text-lg">GLOBEX CONNECT</span>
              </div>
              <p className="text-sm text-white/40">
                The complete travel agency management platform. Built for Bangladesh, ready for the world.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <div className="space-y-2 text-sm text-white/40">
                <a href="#features" className="block hover:text-white/70">Features</a>
                <a href="#pricing" className="block hover:text-white/70">Pricing</a>
                <Link to="/login" className="block hover:text-white/70">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <div className="space-y-2 text-sm text-white/40">
                <a href="#" className="block hover:text-white/70">About Us</a>
                <a href="#contact" className="block hover:text-white/70">Contact</a>
                <a href="#" className="block hover:text-white/70">Privacy Policy</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Follow Us</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cyan-400/20 transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cyan-400/20 transition-colors">
                  <Mail className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cyan-400/20 transition-colors">
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-white/10" />
          <p className="text-center text-sm text-white/30">
            © {new Date().getFullYear()} Globex Connect. All rights reserved. Powered by DigiWebDex.
          </p>
        </div>
      </footer>

      {/* ───── Registration Dialog ───── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0f1f38] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Subscribe to{" "}
              <span className="text-cyan-400">
                {plans.find((p) => p.id === selectedPlan)?.name}
              </span>{" "}
              Plan
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Fill in your company details to get started with a 14-day free trial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Plan summary */}
            <div className="p-3 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-between">
              <span className="text-sm font-medium">
                {plans.find((p) => p.id === selectedPlan)?.name} Plan
              </span>
              <span className="font-bold text-cyan-400">
                ৳{plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}/month
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/70">Company Name *</Label>
                <Input
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  placeholder="Your Travel Agency"
                  required
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Owner Name *</Label>
                <Input
                  value={form.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                  placeholder="Full name"
                  required
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/70">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  required
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Password *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Company address"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/70">Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Team Size</Label>
                <Select value={form.employees} onValueChange={(v) => update("employees", v)}>
                  <SelectTrigger className="bg-white/5 border-white/15 text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 people</SelectItem>
                    <SelectItem value="6-15">6-15 people</SelectItem>
                    <SelectItem value="16-50">16-50 people</SelectItem>
                    <SelectItem value="50+">50+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Additional Notes</Label>
              <Textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Any special requirements..."
                rows={3}
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              {loading ? "Creating Account..." : "Start 14-Day Free Trial"}
            </Button>

            <p className="text-center text-xs text-white/30">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-400 underline">Sign in</Link>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
