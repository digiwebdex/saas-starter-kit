import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingState from "@/components/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  quotationApi, type Quotation, type QuotationItem, type QuotationItemType,
  type ItineraryDay, type QuotationStatus,
} from "@/lib/api";
import {
  ArrowLeft, Save, Plus, Trash2, Hotel, Plane, Stamp, Car, Map, Bike,
  Shield, DollarSign, Percent, Tag, Receipt, CalendarIcon, Eye,
  GripVertical, ChevronUp, ChevronDown, FileText,
} from "lucide-react";

const ITEM_TYPES: { value: QuotationItemType; label: string; icon: any }[] = [
  { value: "hotel", label: "Hotel / Accommodation", icon: Hotel },
  { value: "flight", label: "Flight / Air Ticket", icon: Plane },
  { value: "visa", label: "Visa Processing", icon: Stamp },
  { value: "transport", label: "Transport / Transfer", icon: Car },
  { value: "tour", label: "Tour / Sightseeing", icon: Map },
  { value: "activity", label: "Activity / Excursion", icon: Bike },
  { value: "insurance", label: "Travel Insurance", icon: Shield },
  { value: "service_fee", label: "Service Fee", icon: DollarSign },
  { value: "discount", label: "Discount", icon: Percent },
  { value: "tax", label: "Tax / VAT", icon: Receipt },
];

const getItemIcon = (type: QuotationItemType) => ITEM_TYPES.find((t) => t.value === type)?.icon || FileText;

const makeId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const emptyItem = (day?: number): QuotationItem => ({
  id: makeId(), type: "hotel", day, description: "", details: "", supplier: "",
  costPrice: 0, markupPercent: 15, sellingPrice: 0, quantity: 1, nights: 1, subtotal: 0,
});

const emptyDay = (num: number): ItineraryDay => ({
  dayNumber: num, date: "", title: `Day ${num}`, description: "",
  meals: "", accommodation: "", activities: [],
});

const calcSellingPrice = (cost: number, markup: number) => Math.round(cost * (1 + markup / 100));
const calcSubtotal = (price: number, qty: number) => price * qty;

const QuotationBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("Thailand Family Tour — 5 Nights / 6 Days");
  const [destination, setDestination] = useState("Bangkok & Pattaya, Thailand");
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [travelerCount, setTravelerCount] = useState(2);
  const [travelFrom, setTravelFrom] = useState<Date | undefined>();
  const [travelTo, setTravelTo] = useState<Date | undefined>();
  const [validUntil, setValidUntil] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "• 50% advance payment required at the time of booking confirmation.\n• Balance payment due 15 days before departure.\n• Cancellation charges apply as per company policy.\n• Passport must be valid for at least 6 months from travel date.\n• Prices are subject to change based on availability and exchange rates.\n• Travel insurance is strongly recommended for all passengers."
  );
  const [items, setItems] = useState<QuotationItem[]>([
    { id: makeId(), type: "flight", description: "Dhaka → Bangkok (Round Trip) — Thai Airways", details: "Economy class, 30kg baggage", supplier: "Thai Airways", costPrice: 32000, markupPercent: 10, sellingPrice: 35200, quantity: 2, subtotal: 70400 },
    { id: makeId(), type: "hotel", description: "Novotel Bangkok Sukhumvit — Deluxe Room", details: "Breakfast included, city view", supplier: "Novotel Hotels", costPrice: 5500, markupPercent: 20, sellingPrice: 6600, quantity: 1, nights: 3, subtotal: 19800 },
    { id: makeId(), type: "hotel", description: "Hilton Pattaya — Sea View Room", details: "Breakfast included, beachfront", supplier: "Hilton Hotels", costPrice: 7000, markupPercent: 20, sellingPrice: 8400, quantity: 1, nights: 2, subtotal: 16800 },
    { id: makeId(), type: "transport", description: "Airport Transfer — Bangkok (Round Trip)", details: "Private sedan, meet & greet", supplier: "Local Transport Co.", costPrice: 2000, markupPercent: 25, sellingPrice: 2500, quantity: 2, subtotal: 5000 },
    { id: makeId(), type: "tour", description: "Bangkok City Tour — Grand Palace, Wat Pho, Wat Arun", details: "Full day with English guide, lunch included", supplier: "Siam Tours", costPrice: 3500, markupPercent: 30, sellingPrice: 4550, quantity: 2, subtotal: 9100 },
    { id: makeId(), type: "activity", description: "Coral Island Tour with Speedboat", details: "Snorkeling, parasailing, lunch on island", supplier: "Pattaya Adventures", costPrice: 2800, markupPercent: 25, sellingPrice: 3500, quantity: 2, subtotal: 7000 },
    { id: makeId(), type: "visa", description: "Thailand Visa on Arrival Assistance", details: "Document preparation, fast track", supplier: "In-house", costPrice: 500, markupPercent: 100, sellingPrice: 1000, quantity: 2, subtotal: 2000 },
    { id: makeId(), type: "insurance", description: "Travel Insurance — 7 Days Coverage", details: "Medical, trip cancellation, baggage loss", supplier: "Guardian Life", costPrice: 800, markupPercent: 25, sellingPrice: 1000, quantity: 2, subtotal: 2000 },
    { id: makeId(), type: "service_fee", description: "Service & Processing Fee", supplier: "In-house", costPrice: 0, markupPercent: 0, sellingPrice: 3000, quantity: 1, subtotal: 3000 },
  ]);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { dayNumber: 1, title: "Arrival in Bangkok", description: "Arrive at Suvarnabhumi Airport. Meet & greet by our representative. Private transfer to Novotel Bangkok Sukhumvit. Check-in and rest. Evening free for exploring nearby street food markets and Sukhumvit nightlife.", meals: "Dinner on own", accommodation: "Novotel Bangkok Sukhumvit" },
    { dayNumber: 2, title: "Bangkok City Tour", description: "Full-day guided tour of Bangkok's iconic landmarks. Visit the magnificent Grand Palace, the ancient Wat Pho with its famous Reclining Buddha, and cross the river to the stunning Wat Arun (Temple of Dawn). Lunch at a riverside Thai restaurant.", meals: "Breakfast, Lunch", accommodation: "Novotel Bangkok Sukhumvit" },
    { dayNumber: 3, title: "Bangkok → Pattaya", description: "After breakfast, check out and private transfer to Pattaya (approx. 2 hours). Check in at Hilton Pattaya. Afternoon free to explore Walking Street, enjoy the beachfront promenade, or relax at the hotel pool.", meals: "Breakfast", accommodation: "Hilton Pattaya" },
    { dayNumber: 4, title: "Coral Island Excursion", description: "Speedboat to Coral Island (Koh Larn). Full day of beach activities including snorkeling in crystal-clear waters, optional parasailing, and a delicious seafood lunch on the island. Return to hotel by late afternoon.", meals: "Breakfast, Lunch", accommodation: "Hilton Pattaya" },
    { dayNumber: 5, title: "Free Day & Shopping", description: "Day at leisure. Optional visits to Nong Nooch Tropical Garden, Sanctuary of Truth, or shopping at Central Festival Pattaya Beach mall. Pack and prepare for departure.", meals: "Breakfast", accommodation: "Hilton Pattaya" },
    { dayNumber: 6, title: "Departure", description: "After breakfast, check out from hotel. Private transfer to Suvarnabhumi Airport for your return flight to Dhaka. End of a memorable Thailand experience!", meals: "Breakfast", accommodation: "—" },
  ]);

  // Load existing quotation
  useEffect(() => {
    if (!id) return;
    quotationApi.get(id).then((q) => {
      setTitle(q.title || "");
      setDestination(q.destination || "");
      setClientName(q.clientName || "");
      setClientId(q.clientId || "");
      setLeadName(q.leadName || "");
      setTravelerCount(q.travelerCount || 2);
      setTravelFrom(q.travelDateFrom ? new Date(q.travelDateFrom) : undefined);
      setTravelTo(q.travelDateTo ? new Date(q.travelDateTo) : undefined);
      setValidUntil(q.validUntil ? new Date(q.validUntil) : undefined);
      setNotes(q.notes || "");
      setTerms(q.termsAndConditions || "");
      if (q.items?.length) setItems(q.items);
      if (q.itinerary?.length) setItinerary(q.itinerary);
      setLoading(false);
    }).catch(() => {
      toast({ variant: "destructive", title: "Error loading quotation" });
      setLoading(false);
    });
  }, [id]);

  // Recalculate
  const updateItem = (itemId: string, updates: Partial<QuotationItem>) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const merged = { ...item, ...updates };
      if ("costPrice" in updates || "markupPercent" in updates) {
        merged.sellingPrice = calcSellingPrice(merged.costPrice, merged.markupPercent);
      }
      if ("sellingPrice" in updates && !("costPrice" in updates)) {
        // Manual selling price override
      }
      merged.subtotal = calcSubtotal(merged.sellingPrice, merged.quantity * (merged.type === "hotel" ? (merged.nights || 1) : 1));
      return merged;
    }));
  };

  const addItem = (day?: number) => setItems((prev) => [...prev, emptyItem(day)]);
  const removeItem = (itemId: string) => setItems((prev) => prev.filter((i) => i.id !== itemId));

  const addDay = () => setItinerary((prev) => [...prev, emptyDay(prev.length + 1)]);
  const removeDay = (num: number) => setItinerary((prev) =>
    prev.filter((d) => d.dayNumber !== num).map((d, i) => ({ ...d, dayNumber: i + 1 }))
  );
  const updateDay = (num: number, updates: Partial<ItineraryDay>) => {
    setItinerary((prev) => prev.map((d) => d.dayNumber === num ? { ...d, ...updates } : d));
  };
  const moveDay = (num: number, dir: "up" | "down") => {
    setItinerary((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((d) => d.dayNumber === num);
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return arr;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return arr.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    });
  };

  // Totals
  const totals = useMemo(() => {
    const lineItems = items.filter((i) => i.type !== "discount" && i.type !== "tax");
    const discounts = items.filter((i) => i.type === "discount");
    const taxes = items.filter((i) => i.type === "tax");
    const totalCost = lineItems.reduce((s, i) => s + i.costPrice * i.quantity * (i.type === "hotel" ? (i.nights || 1) : 1), 0);
    const totalSelling = lineItems.reduce((s, i) => s + i.subtotal, 0);
    const discountAmount = discounts.reduce((s, i) => s + i.subtotal, 0);
    const taxAmount = taxes.reduce((s, i) => s + i.subtotal, 0);
    const grandTotal = totalSelling - discountAmount + taxAmount;
    const totalProfit = totalSelling - totalCost;
    return { totalCost, totalSelling, totalProfit, discountAmount, taxAmount, grandTotal };
  }, [items]);

  const handleSave = async (status?: QuotationStatus) => {
    setSaving(true);
    const payload: any = {
      title, destination, clientId: clientId || undefined, clientName: clientName || undefined,
      leadName: leadName || undefined, travelerCount,
      travelDateFrom: travelFrom ? format(travelFrom, "yyyy-MM-dd") : undefined,
      travelDateTo: travelTo ? format(travelTo, "yyyy-MM-dd") : undefined,
      validUntil: validUntil ? format(validUntil, "yyyy-MM-dd") : undefined,
      notes, termsAndConditions: terms,
      items, itinerary, status: status || "draft",
      ...totals,
    };
    try {
      if (isEdit) {
        await quotationApi.update(id!, payload);
        toast({ title: "Quotation updated" });
      } else {
        const created = await quotationApi.create(payload);
        toast({ title: "Quotation created" });
        navigate(`/quotations/${created.id}`);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const DatePick = ({ label, date, onChange }: { label: string; date?: Date; onChange: (d?: Date) => void }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );

  if (loading) return <DashboardLayout><LoadingState rows={8} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/quotations")} className="mb-1">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quotations
            </Button>
            <h1 className="text-2xl font-bold">{isEdit ? "Edit Quotation" : "New Quotation"}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={() => handleSave("sent")} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> Save & Send
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary ({itinerary.length} days)</TabsTrigger>
            <TabsTrigger value="pricing">Pricing ({items.length} items)</TabsTrigger>
            <TabsTrigger value="notes">Notes & Terms</TabsTrigger>
          </TabsList>

          {/* ── DETAILS TAB ── */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Quotation Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Quotation Title *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Malaysia Family Tour — 4N/5D" />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Mr. Karim Ahmed" />
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Name (if from lead)</Label>
                    <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Optional — link to existing lead" />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination *</Label>
                    <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Dubai & Abu Dhabi, UAE" />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Travelers</Label>
                    <Input type="number" min={1} value={travelerCount} onChange={(e) => setTravelerCount(+e.target.value)} />
                  </div>
                  <DatePick label="Travel From" date={travelFrom} onChange={setTravelFrom} />
                  <DatePick label="Travel To" date={travelTo} onChange={setTravelTo} />
                  <DatePick label="Quote Valid Until" date={validUntil} onChange={setValidUntil} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ITINERARY TAB ── */}
          <TabsContent value="itinerary" className="space-y-4">
            {itinerary.map((day) => (
              <Card key={day.dayNumber}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Day {day.dayNumber}</Badge>
                      <Input
                        className="h-8 font-medium border-none shadow-none px-1 text-base focus-visible:ring-0"
                        value={day.title}
                        onChange={(e) => updateDay(day.dayNumber, { title: e.target.value })}
                        placeholder="Day title"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveDay(day.dayNumber, "up")} disabled={day.dayNumber === 1}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveDay(day.dayNumber, "down")} disabled={day.dayNumber === itinerary.length}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeDay(day.dayNumber)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea rows={3} value={day.description} onChange={(e) => updateDay(day.dayNumber, { description: e.target.value })} placeholder="Describe the day's activities, sights, and experiences..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Meals</Label>
                      <Input value={day.meals || ""} onChange={(e) => updateDay(day.dayNumber, { meals: e.target.value })} placeholder="e.g. Breakfast, Lunch" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Accommodation</Label>
                      <Input value={day.accommodation || ""} onChange={(e) => updateDay(day.dayNumber, { accommodation: e.target.value })} placeholder="e.g. Hilton Pattaya" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addDay} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Day {itinerary.length + 1}
            </Button>
          </TabsContent>

          {/* ── PRICING TAB ── */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Line Items</CardTitle>
                  <Button size="sm" onClick={() => addItem()}><Plus className="mr-1 h-3.5 w-3.5" /> Add Item</Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="w-[100px]">Cost (৳)</TableHead>
                      <TableHead className="w-[80px]">Markup %</TableHead>
                      <TableHead className="w-[100px]">Selling (৳)</TableHead>
                      <TableHead className="w-[60px]">Qty</TableHead>
                      <TableHead className="w-[60px]">Nights</TableHead>
                      <TableHead className="w-[100px]">Subtotal</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const Icon = getItemIcon(item.type);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select value={item.type} onValueChange={(v) => updateItem(item.id, { type: v as QuotationItemType })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ITEM_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    <div className="flex items-center gap-1.5"><t.icon className="h-3 w-3" />{t.label}</div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-xs" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder="Description" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="h-8 text-xs" value={item.costPrice} onChange={(e) => updateItem(item.id, { costPrice: +e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="h-8 text-xs" value={item.markupPercent} onChange={(e) => updateItem(item.id, { markupPercent: +e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="h-8 text-xs" value={item.sellingPrice} onChange={(e) => updateItem(item.id, { sellingPrice: +e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={1} className="h-8 text-xs" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: +e.target.value })} />
                          </TableCell>
                          <TableCell>
                            {item.type === "hotel" ? (
                              <Input type="number" min={1} className="h-8 text-xs" value={item.nights || 1} onChange={(e) => updateItem(item.id, { nights: +e.target.value })} />
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="font-medium text-sm">৳{item.subtotal.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Totals Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="max-w-sm ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span>৳{totals.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Selling</span>
                    <span>৳{totals.totalSelling.toLocaleString()}</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount</span>
                      <span>-৳{totals.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {totals.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>+৳{totals.taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span>৳{totals.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Estimated Profit</span>
                    <span>৳{totals.totalProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Profit Margin</span>
                    <span>{totals.totalSelling > 0 ? ((totals.totalProfit / totals.totalSelling) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── NOTES TAB ── */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Internal Notes</CardTitle></CardHeader>
              <CardContent>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (not visible to client)..." />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Terms & Conditions</CardTitle></CardHeader>
              <CardContent>
                <Textarea rows={8} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Enter terms and conditions..." />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default QuotationBuilder;
