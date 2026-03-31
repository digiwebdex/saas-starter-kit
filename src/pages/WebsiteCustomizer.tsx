import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { websiteApi, templateDefaults, type WebsiteConfig } from "@/lib/websiteApi";
import { Plane, Moon, Mountain, Check, Palette, Type, Image, Eye, Plus, Trash2, Save } from "lucide-react";

const templates = [
  {
    id: "travel-agency" as const,
    name: "Travel Agency",
    desc: "Classic travel agency with flights, hotels, visa",
    icon: Plane,
    color: "bg-blue-500",
  },
  {
    id: "hajj-umrah" as const,
    name: "Hajj & Umrah",
    desc: "Specialized for Hajj/Umrah service providers",
    icon: Moon,
    color: "bg-emerald-500",
  },
  {
    id: "tour-packages" as const,
    name: "Tour Packages",
    desc: "Adventure & leisure tour operator",
    icon: Mountain,
    color: "bg-purple-500",
  },
];

const WebsiteCustomizer = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<WebsiteConfig>(templateDefaults["travel-agency"]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    websiteApi.getConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  const selectTemplate = (id: WebsiteConfig["template"]) => {
    const defaults = templateDefaults[id];
    setConfig((prev) => ({
      ...prev,
      template: id,
      colors: { ...defaults.colors },
      content: { ...defaults.content },
    }));
  };

  const updateColor = (key: keyof WebsiteConfig["colors"], value: string) => {
    setConfig((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateContent = (key: keyof WebsiteConfig["content"], value: string) => {
    setConfig((prev) => ({ ...prev, content: { ...prev.content, [key]: value } }));
  };

  const updateService = (index: number, field: string, value: string) => {
    setConfig((prev) => {
      const services = [...prev.content.services];
      services[index] = { ...services[index], [field]: value };
      return { ...prev, content: { ...prev.content, services } };
    });
  };

  const addService = () => {
    setConfig((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        services: [...prev.content.services, { icon: "Star", title: "", desc: "" }],
      },
    }));
  };

  const removeService = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        services: prev.content.services.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await websiteApi.saveConfig(config);
      toast({ title: "সেভ হয়েছে!", description: "ওয়েবসাইট কাস্টমাইজেশন সফলভাবে সেভ হয়েছে।" });
    } catch {
      toast({ title: "ত্রুটি", description: "সেভ করতে সমস্যা হয়েছে।", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Convert HSL string to hex for color input
  const hslToHex = (hsl: string): string => {
    const parts = hsl.split(" ").map(Number);
    if (parts.length < 3) return "#3b82f6";
    const [h, s, l] = [parts[0], parts[1] / 100, parts[2] / 100];
    const a2 = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a2 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert hex to HSL string
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
      }
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Website Customizer</h1>
            <p className="text-muted-foreground">আপনার ওয়েবসাইটের ডিজাইন ও কন্টেন্ট পরিবর্তন করুন</p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </div>

        <Tabs defaultValue="template" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="template"><Image className="mr-2 h-4 w-4" />Template</TabsTrigger>
            <TabsTrigger value="colors"><Palette className="mr-2 h-4 w-4" />Colors</TabsTrigger>
            <TabsTrigger value="content"><Type className="mr-2 h-4 w-4" />Content</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" />Preview</TabsTrigger>
          </TabsList>

          {/* Template Selection */}
          <TabsContent value="template">
            <div className="grid gap-4 md:grid-cols-3">
              {templates.map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    config.template === t.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => selectTemplate(t.id)}
                >
                  <CardContent className="pt-6 text-center">
                    <div className={`${t.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <t.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{t.desc}</p>
                    {config.template === t.id && (
                      <Badge className="gap-1"><Check className="h-3 w-3" />Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>আপনার কোম্পানির লোগো আপলোড করুন (URL)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      placeholder="https://example.com/logo.png"
                      value={config.logo || ""}
                      onChange={(e) => setConfig((prev) => ({ ...prev, logo: e.target.value }))}
                    />
                  </div>
                  {config.logo && (
                    <div className="h-16 w-16 border rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                      <img src={config.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors */}
          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>ওয়েবসাইটের রং পরিবর্তন করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {(Object.keys(config.colors) as (keyof WebsiteConfig["colors"])[]).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key}</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={hslToHex(config.colors[key])}
                          onChange={(e) => updateColor(key, hexToHsl(e.target.value))}
                          className="w-12 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={config.colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="flex-1"
                          placeholder="H S% L%"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color Preview */}
                <div className="mt-8 p-6 rounded-xl border">
                  <h4 className="font-semibold mb-4">Color Preview</h4>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(config.colors).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <div
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ backgroundColor: `hsl(${val})` }}
                        />
                        <span className="text-xs text-muted-foreground mt-1 block capitalize">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hero Title</Label>
                  <Input
                    value={config.content.heroTitle}
                    onChange={(e) => updateContent("heroTitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle</Label>
                  <Textarea
                    value={config.content.heroSubtitle}
                    onChange={(e) => updateContent("heroSubtitle", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>About Title</Label>
                  <Input
                    value={config.content.aboutTitle}
                    onChange={(e) => updateContent("aboutTitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>About Text</Label>
                  <Textarea
                    value={config.content.aboutText}
                    onChange={(e) => updateContent("aboutText", e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Services</CardTitle>
                  <CardDescription>আপনার সেবাসমূহ যুক্ত/সম্পাদনা করুন</CardDescription>
                </div>
                <Button onClick={addService} size="sm" variant="outline">
                  <Plus className="mr-1 h-4 w-4" />Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.content.services.map((service, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Icon Name</Label>
                        <Input
                          value={service.icon}
                          onChange={(e) => updateService(i, "icon", e.target.value)}
                          placeholder="Plane, Hotel, etc."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Title</Label>
                        <Input
                          value={service.title}
                          onChange={(e) => updateService(i, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={service.desc}
                          onChange={(e) => updateService(i, "desc", e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeService(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Footer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Footer Text</Label>
                  <Input
                    value={config.content.footerText}
                    onChange={(e) => updateContent("footerText", e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Facebook</Label>
                    <Input
                      value={config.socialLinks?.facebook || ""}
                      onChange={(e) => setConfig((p) => ({ ...p, socialLinks: { ...p.socialLinks, facebook: e.target.value } }))}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input
                      value={config.socialLinks?.instagram || ""}
                      onChange={(e) => setConfig((p) => ({ ...p, socialLinks: { ...p.socialLinks, instagram: e.target.value } }))}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={config.socialLinks?.whatsapp || ""}
                      onChange={(e) => setConfig((p) => ({ ...p, socialLinks: { ...p.socialLinks, whatsapp: e.target.value } }))}
                      placeholder="https://wa.me/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter/X</Label>
                    <Input
                      value={config.socialLinks?.twitter || ""}
                      onChange={(e) => setConfig((p) => ({ ...p, socialLinks: { ...p.socialLinks, twitter: e.target.value } }))}
                      placeholder="https://x.com/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                {/* Mini Hero Preview */}
                <div
                  className="p-12 text-center"
                  style={{ backgroundColor: `hsl(${config.colors.primary} / 0.1)` }}
                >
                  {config.logo && (
                    <img src={config.logo} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />
                  )}
                  <h2
                    className="text-3xl font-extrabold mb-2"
                    style={{ color: `hsl(${config.colors.text})` }}
                  >
                    {config.content.heroTitle}
                  </h2>
                  <p
                    className="max-w-xl mx-auto"
                    style={{ color: `hsl(${config.colors.text} / 0.7)` }}
                  >
                    {config.content.heroSubtitle}
                  </p>
                  <div className="mt-6 flex gap-3 justify-center">
                    <Button style={{ backgroundColor: `hsl(${config.colors.primary})`, color: "white" }}>
                      View Packages
                    </Button>
                    <Button variant="outline" style={{ borderColor: `hsl(${config.colors.primary})`, color: `hsl(${config.colors.primary})` }}>
                      Contact Us
                    </Button>
                  </div>
                </div>

                {/* Mini Services Preview */}
                <div className="p-8" style={{ backgroundColor: `hsl(${config.colors.background})` }}>
                  <h3 className="text-xl font-bold text-center mb-6" style={{ color: `hsl(${config.colors.text})` }}>
                    Our Services
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {config.content.services.map((s, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border text-center"
                        style={{ borderColor: `hsl(${config.colors.primary} / 0.2)` }}
                      >
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: `hsl(${config.colors.primary})` }}
                        >
                          {s.icon.charAt(0)}
                        </div>
                        <h4 className="font-semibold text-sm" style={{ color: `hsl(${config.colors.text})` }}>
                          {s.title}
                        </h4>
                        <p className="text-xs mt-1" style={{ color: `hsl(${config.colors.text} / 0.6)` }}>
                          {s.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini Footer Preview */}
                <div
                  className="p-6 text-center text-sm"
                  style={{
                    backgroundColor: `hsl(${config.colors.text})`,
                    color: `hsl(${config.colors.background})`,
                  }}
                >
                  {config.content.footerText}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WebsiteCustomizer;
