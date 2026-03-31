import { clientApi, bookingApi, invoiceApi, paymentApi, agentApi, vendorApi, leadApi } from "@/lib/api";

function convertToCSV(data: any[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportResult {
  resource: string;
  count: number;
  success: boolean;
  error?: string;
}

const resourceApis = {
  clients: { api: clientApi, label: "Clients" },
  agents: { api: agentApi, label: "Agents" },
  vendors: { api: vendorApi, label: "Vendors" },
  leads: { api: leadApi, label: "Leads" },
  bookings: { api: bookingApi, label: "Bookings" },
  invoices: { api: invoiceApi, label: "Invoices" },
  payments: { api: paymentApi, label: "Payments" },
};

export type ExportResource = keyof typeof resourceApis;

export async function exportResource(resource: ExportResource): Promise<ExportResult> {
  const { api, label } = resourceApis[resource];
  try {
    const data = await api.list();
    if (!data.length) {
      return { resource: label, count: 0, success: false, error: "No data to export" };
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    convertToCSV(data as any[], `${resource}_${timestamp}`);
    return { resource: label, count: data.length, success: true };
  } catch (err: any) {
    return { resource: label, count: 0, success: false, error: err.message };
  }
}

export async function exportAllData(): Promise<ExportResult[]> {
  const results: ExportResult[] = [];
  for (const key of Object.keys(resourceApis) as ExportResource[]) {
    const result = await exportResource(key);
    results.push(result);
  }
  return results;
}

export function getExportResources() {
  return Object.entries(resourceApis).map(([key, val]) => ({
    id: key as ExportResource,
    label: val.label,
  }));
}
