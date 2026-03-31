import { clientApi, bookingApi, invoiceApi, paymentApi } from "@/lib/api";

const sampleClients = [
  { name: "Ahmed Rahman", phone: "+8801711000001", email: "ahmed@example.com" },
  { name: "Fatima Begum", phone: "+8801711000002", email: "fatima@example.com" },
  { name: "Mohammad Ali", phone: "+8801711000003", email: "ali@example.com" },
  { name: "Nusrat Jahan", phone: "+8801711000004", email: "nusrat@example.com" },
  { name: "Kamal Hossain", phone: "+8801711000005", email: "kamal@example.com" },
];

const bookingTypes: Array<"tour" | "ticket" | "hotel" | "visa"> = ["tour", "ticket", "hotel", "visa"];
const bookingStatuses: Array<"pending" | "confirmed" | "completed"> = ["pending", "confirmed", "completed"];
const paymentMethods: Array<"cash" | "bank"> = ["cash", "bank"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export async function seedDemoData(): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Create sample clients
    const createdClients: string[] = [];
    for (const c of sampleClients) {
      try {
        const client = await clientApi.create(c as any);
        createdClients.push(client.id);
      } catch {
        // Client may already exist, continue
      }
    }

    if (createdClients.length === 0) {
      return { success: true }; // Demo data may already exist
    }

    // 2. Create sample bookings
    const createdBookings: Array<{ id: string; amount: number }> = [];
    for (let i = 0; i < 8; i++) {
      const amount = randomAmount(5000, 80000);
      const cost = amount * (0.6 + Math.random() * 0.25);
      try {
        const booking = await bookingApi.create({
          type: randomItem(bookingTypes),
          clientId: randomItem(createdClients),
          agentId: "",
          amount,
          cost: Math.round(cost * 100) / 100,
          profit: Math.round((amount - cost) * 100) / 100,
          status: randomItem(bookingStatuses),
        } as any);
        createdBookings.push({ id: booking.id, amount });
      } catch {
        // Continue on error
      }
    }

    // 3. Create sample invoices
    const createdInvoices: Array<{ id: string; bookingId: string; totalAmount: number }> = [];
    for (const b of createdBookings.slice(0, 6)) {
      const paidRatio = Math.random();
      const paidAmount = Math.round(b.amount * paidRatio * 100) / 100;
      const dueAmount = Math.round((b.amount - paidAmount) * 100) / 100;
      const status = paidRatio > 0.95 ? "paid" : paidRatio > 0.3 ? "partial" : "unpaid";
      try {
        const invoice = await invoiceApi.create({
          bookingId: b.id,
          totalAmount: b.amount,
          paidAmount,
          dueAmount,
          status,
        } as any);
        createdInvoices.push({ id: invoice.id, bookingId: b.id, totalAmount: b.amount });
      } catch {
        // Continue
      }
    }

    // 4. Create sample payments
    for (const inv of createdInvoices.slice(0, 4)) {
      const amount = randomAmount(1000, inv.totalAmount * 0.5);
      try {
        await paymentApi.create({
          invoiceId: inv.id,
          bookingId: inv.bookingId,
          amount,
          method: randomItem(paymentMethods),
          date: new Date().toISOString(),
        } as any);
      } catch {
        // Continue
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
