import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  MessageSquare, Plus, Pencil, Trash2, Eye, Copy, Loader2, Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  type SmsTemplate, type SmsTemplateType,
  TEMPLATE_VARIABLES, DEFAULT_TEMPLATES,
  extractVariables, renderTemplate,
  smsTemplateApi,
} from "@/lib/smsTemplateApi";

const TYPE_COLORS: Record<SmsTemplateType, string> = {
  booking: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  payment: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  otp: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  reminder: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  custom: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
};

const TYPE_LABELS: Record<SmsTemplateType, string> = {
  booking: "Booking",
  payment: "Payment",
  otp: "OTP",
  reminder: "Reminder",
  custom: "Custom",
};

const emptyForm = {
  name: "",
  type: "booking" as SmsTemplateType,
  message: "",
  variables: [] as string[],
  isActive: true,
};

const AdminSmsTemplates = () => {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await smsTemplateApi.list();
      setTemplates(data);
    } catch {
      // Use defaults as fallback for demo
      const fallback: SmsTemplate[] = DEFAULT_TEMPLATES.map((t, i) => ({
        ...t,
        id: `tpl-${i + 1}`,
        createdAt: new Date().toISOString(),
      }));
      setTemplates(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleOpen = (template?: SmsTemplate) => {
    if (template) {
      setEditId(template.id);
      setForm({
        name: template.name,
        type: template.type,
        message: template.message,
        variables: template.variables,
        isActive: template.isActive,
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast({ title: "Name and message are required", variant: "destructive" });
      return;
    }

    const vars = extractVariables(form.message);
    const payload = { ...form, variables: vars };

    setSaving(true);
    try {
      if (editId) {
        await smsTemplateApi.update(editId, payload);
        setTemplates((prev) => prev.map((t) => (t.id === editId ? { ...t, ...payload } : t)));
      } else {
        const created = await smsTemplateApi.create(payload);
        setTemplates((prev) => [...prev, created]);
      }
      toast({ title: editId ? "Template updated" : "Template created" });
    } catch {
      // Offline fallback
      if (editId) {
        setTemplates((prev) => prev.map((t) => (t.id === editId ? { ...t, ...payload } : t)));
      } else {
        setTemplates((prev) => [...prev, { ...payload, id: `tpl-${Date.now()}`, createdAt: new Date().toISOString() }]);
      }
      toast({ title: editId ? "Template updated (local)" : "Template created (local)" });
    } finally {
      setSaving(false);
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await smsTemplateApi.delete(id);
    } catch { /* offline */ }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Template deleted" });
  };

  const handlePreview = (template: SmsTemplate) => {
    setSelectedTemplate(template);
    const sampleData: Record<string, string> = {};
    const availableVars = TEMPLATE_VARIABLES[template.type] || [];
    template.variables.forEach((v) => {
      const found = availableVars.find((av) => av.key === v);
      sampleData[v] = found ? `[${found.label}]` : `[${v}]`;
    });
    setPreviewData(sampleData);
    setPreviewOpen(true);
  };

  const insertVariable = (key: string) => {
    setForm((f) => ({ ...f, message: f.message + `{{${key}}}` }));
  };

  const filtered = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.message.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-8 w-8" /> SMS Templates
            </h1>
            <p className="text-muted-foreground">Manage SMS message templates with dynamic variables</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="otp">OTP</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No templates found</p>
                <p className="text-sm">Create your first SMS template to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Message Preview</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tpl) => (
                    <TableRow key={tpl.id}>
                      <TableCell className="font-medium">{tpl.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={TYPE_COLORS[tpl.type]}>
                          {TYPE_LABELS[tpl.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[300px]">
                        <p className="text-sm text-muted-foreground truncate">{tpl.message}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tpl.variables.slice(0, 3).map((v) => (
                            <Badge key={v} variant="outline" className="text-xs font-mono">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                          {tpl.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{tpl.variables.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tpl.isActive ? "default" : "secondary"}>
                          {tpl.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePreview(tpl)} title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(tpl)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(tpl.id)} title="Delete" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Template" : "New SMS Template"}</DialogTitle>
              <DialogDescription>
                Use {"{{variable}}"} syntax to insert dynamic content into your messages.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input placeholder="e.g. Booking Confirmation" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v: SmsTemplateType) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="otp">OTP</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Available Variables */}
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <p className="text-xs text-muted-foreground">Click to insert into message</p>
                <div className="flex flex-wrap gap-2">
                  {(TEMPLATE_VARIABLES[form.type] || []).map((v) => (
                    <Button
                      key={v.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono h-7"
                      onClick={() => insertVariable(v.key)}
                      title={v.label}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {`{{${v.key}}}`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message Template</Label>
                <Textarea
                  rows={4}
                  placeholder='e.g. Dear {{name}}, your booking ({{bookingId}}) is confirmed.'
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {form.message.length} characters · Detected variables: {extractVariables(form.message).map((v) => `{{${v}}}`).join(", ") || "none"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>Active</Label>
              </div>

              {/* Live preview */}
              {form.message && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm">Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <p className="text-sm">
                      {renderTemplate(form.message, Object.fromEntries(
                        extractVariables(form.message).map((v) => {
                          const found = (TEMPLATE_VARIABLES[form.type] || []).find((tv) => tv.key === v);
                          return [v, found ? found.label : v];
                        })
                      ))}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId ? "Update" : "Create"} Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                Fill in sample values to see how the SMS will look.
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={TYPE_COLORS[selectedTemplate.type]}>
                    {TYPE_LABELS[selectedTemplate.type]}
                  </Badge>
                  <span className="font-medium">{selectedTemplate.name}</span>
                </div>

                <div className="space-y-3">
                  {selectedTemplate.variables.map((v) => {
                    const found = (TEMPLATE_VARIABLES[selectedTemplate.type] || []).find((tv) => tv.key === v);
                    return (
                      <div key={v} className="space-y-1">
                        <Label className="text-xs">{found?.label || v} <span className="font-mono text-muted-foreground">{`{{${v}}}`}</span></Label>
                        <Input
                          value={previewData[v] || ""}
                          onChange={(e) => setPreviewData({ ...previewData, [v]: e.target.value })}
                          placeholder={found?.label || v}
                          className="h-8 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm">Rendered SMS</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <p className="text-sm whitespace-pre-wrap">
                      {renderTemplate(selectedTemplate.message, previewData)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {renderTemplate(selectedTemplate.message, previewData).length} characters
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSmsTemplates;
