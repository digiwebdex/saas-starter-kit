import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { quotationApi, type Quotation } from "@/lib/api";
import { ArrowLeft, Printer, Hotel, Plane, Stamp, Car, Map, Bike, Shield, DollarSign, Percent, Receipt, FileText } from "lucide-react";

const ITEM_ICONS: Record<string, any> = {
  hotel: Hotel, flight: Plane, visa: Stamp, transport: Car, tour: Map,
  activity: Bike, insurance: Shield, service_fee: DollarSign, discount: Percent, tax: Receipt,
};

const QuotationPrint = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    quotationApi.get(id).then((q) => { setQuotation(q); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!quotation) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Quotation not found.</div>;

  const lineItems = quotation.items?.filter((i) => i.type !== "discount" && i.type !== "tax") || [];
  const discounts = quotation.items?.filter((i) => i.type === "discount") || [];
  const taxes = quotation.items?.filter((i) => i.type === "tax") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Print toolbar (hidden in print) */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotations/${id}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print / Save PDF</Button>
      </div>

      {/* Printable content */}
      <div className="max-w-[210mm] mx-auto px-8 py-10 print:px-0 print:py-0 print:max-w-none">
        {/* Header */}
        <div className="border-b pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground">[Your Agency Name]</h1>
              <p className="text-sm text-muted-foreground">Licensed Travel Agency</p>
              <p className="text-xs text-muted-foreground mt-1">Phone: +880 1XXX-XXXXXX | Email: info@agency.com</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Quotation</p>
              <p className="text-lg font-bold">#{quotation.id?.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">Version {quotation.version || 1}</p>
              <p className="text-xs text-muted-foreground">Date: {quotation.createdAt?.slice(0, 10)}</p>
              {quotation.validUntil && <p className="text-xs text-muted-foreground">Valid Until: {quotation.validUntil}</p>}
            </div>
          </div>
        </div>

        {/* Title & Client */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">{quotation.title}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              {quotation.clientName && <p><span className="text-muted-foreground">Client:</span> <strong>{quotation.clientName}</strong></p>}
              {quotation.destination && <p><span className="text-muted-foreground">Destination:</span> {quotation.destination}</p>}
            </div>
            <div>
              <p><span className="text-muted-foreground">Travelers:</span> {quotation.travelerCount || 1} person(s)</p>
              {(quotation.travelDateFrom || quotation.travelDateTo) && (
                <p><span className="text-muted-foreground">Travel Dates:</span> {quotation.travelDateFrom || "TBD"} → {quotation.travelDateTo || "TBD"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Itinerary */}
        {quotation.itinerary?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-bold border-b pb-2 mb-4">Tour Itinerary</h3>
            {quotation.itinerary.map((day) => (
              <div key={day.dayNumber} className="mb-4 pb-3 border-b border-dashed last:border-0">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs print:bg-gray-100 print:text-gray-900">
                    {day.dayNumber}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{day.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{day.description}</p>
                    {(day.meals || day.accommodation) && (
                      <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground">
                        {day.meals && <span>🍽️ <strong>Meals:</strong> {day.meals}</span>}
                        {day.accommodation && <span>🏨 <strong>Stay:</strong> {day.accommodation}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Table */}
        <div className="mb-8">
          <h3 className="text-base font-bold border-b pb-2 mb-4">Cost Breakdown</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Service</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Rate (৳)</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Amount (৳)</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-dashed">
                  <td className="py-2 capitalize">{item.type.replace("_", " ")}</td>
                  <td className="py-2 text-muted-foreground">{item.description}</td>
                  <td className="py-2 text-center">{item.quantity}{item.type === "hotel" && item.nights ? ` × ${item.nights}N` : ""}</td>
                  <td className="py-2 text-right">{item.sellingPrice.toLocaleString()}</td>
                  <td className="py-2 text-right font-medium">{item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 max-w-xs ml-auto border-t pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>৳{(quotation.totalSelling || 0).toLocaleString()}</span>
            </div>
            {discounts.map((d, i) => (
              <div key={i} className="flex justify-between text-sm text-red-600">
                <span>{d.description || "Discount"}</span>
                <span>-৳{d.subtotal.toLocaleString()}</span>
              </div>
            ))}
            {taxes.map((t, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.description || "Tax"}</span>
                <span>+৳{t.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Grand Total</span>
              <span>৳{(quotation.grandTotal || 0).toLocaleString()}</span>
            </div>
            {quotation.travelerCount > 1 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Per Person</span>
                <span>৳{Math.round((quotation.grandTotal || 0) / quotation.travelerCount).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Terms */}
        {quotation.termsAndConditions && (
          <div className="mb-6">
            <h3 className="text-base font-bold border-b pb-2 mb-3">Terms & Conditions</h3>
            <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {quotation.termsAndConditions}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-4 mt-8 text-center text-xs text-muted-foreground">
          <p>Thank you for choosing [Your Agency Name]. We look forward to making your trip memorable!</p>
          <p className="mt-1">This is a computer-generated quotation. Prices are subject to availability.</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:px-0 { padding-left: 20mm; padding-right: 20mm; }
          .print\\:py-0 { padding-top: 10mm; padding-bottom: 10mm; }
          .print\\:max-w-none { max-width: none; }
          .print\\:bg-gray-100 { background-color: #f3f4f6 !important; }
          .print\\:text-gray-900 { color: #111827 !important; }
        }
      `}</style>
    </div>
  );
};

export default QuotationPrint;
