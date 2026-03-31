// SMS Automation — triggers SMS on business events using templates
import { smsApi } from "./smsApi";
import { smsTemplateApi, renderTemplate, type SmsTemplateType } from "./smsTemplateApi";

export interface SmsAutomationContext {
  // Booking
  bookingId?: string;
  bookingType?: string;
  bookingStatus?: string;
  bookingAmount?: number;
  bookingDate?: string;
  // Payment
  paymentAmount?: number;
  paymentMethod?: string;
  invoiceId?: string;
  balance?: number;
  // Common
  clientName?: string;
  clientPhone?: string;
  agentName?: string;
  company?: string;
}

/** Build variable map from context for template rendering */
function buildVariableMap(ctx: SmsAutomationContext): Record<string, string> {
  return {
    name: ctx.clientName || "Customer",
    bookingId: ctx.bookingId || "",
    type: ctx.bookingType || "",
    status: ctx.bookingStatus || "",
    amount: ctx.bookingAmount?.toLocaleString() ?? ctx.paymentAmount?.toLocaleString() ?? "0",
    date: ctx.bookingDate || new Date().toLocaleDateString(),
    agent: ctx.agentName || "",
    company: ctx.company || "Travel Agency",
    invoiceId: ctx.invoiceId || "",
    method: ctx.paymentMethod || "",
    balance: ctx.balance?.toLocaleString() ?? "0",
  };
}

/**
 * Send an automated SMS for a given event type.
 * Finds the first active template matching the type, renders it, and sends.
 * Silently fails if no template or SMS is disabled — never blocks the main flow.
 */
export async function triggerSmsAutomation(
  type: SmsTemplateType,
  ctx: SmsAutomationContext
): Promise<{ sent: boolean; error?: string }> {
  try {
    if (!ctx.clientPhone) {
      return { sent: false, error: "No phone number provided" };
    }

    // Fetch active templates for this type
    let templates;
    try {
      templates = await smsTemplateApi.list();
    } catch {
      return { sent: false, error: "Could not load templates" };
    }

    const template = templates.find((t) => t.type === type && t.isActive);
    if (!template) {
      return { sent: false, error: `No active ${type} template found` };
    }

    // Render the message
    const variables = buildVariableMap(ctx);
    const message = renderTemplate(template.message, variables);

    // Send via backend
    const result = await smsApi.send({
      phone: ctx.clientPhone,
      message,
      templateId: template.id,
    });

    return { sent: result.success, error: result.error };
  } catch (err: any) {
    console.error(`[SMS Automation] ${type} failed:`, err);
    return { sent: false, error: err.message };
  }
}

// ── Convenience wrappers for each event ──

export function sendBookingSms(ctx: SmsAutomationContext) {
  return triggerSmsAutomation("booking", ctx);
}

export function sendPaymentSms(ctx: SmsAutomationContext) {
  return triggerSmsAutomation("payment", ctx);
}

export function sendReminderSms(ctx: SmsAutomationContext) {
  return triggerSmsAutomation("reminder", ctx);
}
