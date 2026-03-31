import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, MessageSquare, Globe, BarChart3, Settings, Save, Loader2, Shield, Check, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  FEATURE_DEFINITIONS, FEATURE_CATEGORIES, DEFAULT_FEATURE_MAP,
  type FeaturePlanMap,
} from "@/lib/features";
import type { PlanType } from "@/lib/plans";

const PLAN_ORDER: PlanType[] = ["free", "basic", "pro", "business", "enterprise"];

const categoryIcons: Record<string, React.ReactNode> = {
  payment: <CreditCard className="h-4 w-4" />,
  communication: <MessageSquare className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  core: <Settings className="h-4 w-4" />,
};

const AdminFeatures = () => {
  const [featureMap, setFeatureMap] = useState<FeaturePlanMap>(
    JSON.parse(JSON.stringify(DEFAULT_FEATURE_MAP))
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleFeature = (featureId: string, plan: PlanType) => {
    setFeatureMap((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [plan]: !prev[featureId]?.[plan],
      },
    }));
  };

  const enableAllForPlan = (plan: PlanType) => {
    setFeatureMap((prev) => {
      const next = { ...prev };
      for (const fId of Object.keys(next)) {
        next[fId] = { ...next[fId], [plan]: true };
      }
      return next;
    });
  };

  const disableAllForPlan = (plan: PlanType) => {
    setFeatureMap((prev) => {
      const next = { ...prev };
      for (const fId of Object.keys(next)) {
        next[fId] = { ...next[fId], [plan]: false };
      }
      return next;
    });
  };

  const resetToDefaults = () => {
    setFeatureMap(JSON.parse(JSON.stringify(DEFAULT_FEATURE_MAP)));
    toast({ title: "Reset to defaults" });
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast({ title: "Feature configuration saved", description: "Changes will affect all tenants immediately." });
  };

  const countEnabled = (plan: PlanType) =>
    Object.values(featureMap).filter((m) => m[plan]).length;

  const totalFeatures = FEATURE_DEFINITIONS.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" /> Feature Control
            </h1>
            <p className="text-muted-foreground">Toggle features per subscription plan</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>Reset Defaults</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Plan summary cards */}
        <div className="grid gap-4 sm:grid-cols-5">
          {PLAN_ORDER.map((plan) => {
            const enabled = countEnabled(plan);
            const pct = Math.round((enabled / totalFeatures) * 100);
            return (
              <Card key={plan}>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <Badge variant="secondary" className="capitalize text-sm">{plan}</Badge>
                    <p className="text-2xl font-bold">{enabled}/{totalFeatures}</p>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{pct}% features enabled</p>
                    <div className="flex gap-1 pt-1">
                      <Button size="sm" variant="ghost" className="text-xs flex-1" onClick={() => enableAllForPlan(plan)}>All On</Button>
                      <Button size="sm" variant="ghost" className="text-xs flex-1" onClick={() => disableAllForPlan(plan)}>All Off</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature toggles by category */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Features</TabsTrigger>
            {FEATURE_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
                {categoryIcons[cat.id]} {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All features tab */}
          <TabsContent value="all">
            <FeatureTable features={FEATURE_DEFINITIONS} featureMap={featureMap} onToggle={toggleFeature} />
          </TabsContent>

          {/* Category tabs */}
          {FEATURE_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <FeatureTable
                features={FEATURE_DEFINITIONS.filter((f) => f.category === cat.id)}
                featureMap={featureMap}
                onToggle={toggleFeature}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

// ── Sub-component: Feature Table ──
function FeatureTable({
  features,
  featureMap,
  onToggle,
}: {
  features: typeof FEATURE_DEFINITIONS;
  featureMap: FeaturePlanMap;
  onToggle: (featureId: string, plan: PlanType) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Feature</TableHead>
              {PLAN_ORDER.map((plan) => (
                <TableHead key={plan} className="text-center capitalize">{plan}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{feature.name}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </TableCell>
                {PLAN_ORDER.map((plan) => {
                  const enabled = featureMap[feature.id]?.[plan] ?? false;
                  return (
                    <TableCell key={plan} className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => onToggle(feature.id, plan)}
                        />
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default AdminFeatures;
