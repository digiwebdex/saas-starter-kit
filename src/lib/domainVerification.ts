// Domain Verification — generate tokens and check DNS TXT records

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Generate a unique verification token for a domain.
 */
export function generateVerificationToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "tas-verify-";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Check DNS TXT record for domain verification.
 * Uses Google DNS-over-HTTPS API (public, no key needed).
 * Looks for TXT record at _verify.{domain} matching the token.
 */
export async function verifyDomainDns(
  domain: string,
  expectedToken: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const lookupDomain = `_verify.${domain}`;
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(lookupDomain)}&type=TXT`
    );

    if (!res.ok) {
      return { verified: false, error: "DNS lookup failed" };
    }

    const data = await res.json();

    if (!data.Answer || data.Answer.length === 0) {
      return {
        verified: false,
        error: "No TXT record found at _verify." + domain,
      };
    }

    // Check if any TXT record matches the expected token
    const found = data.Answer.some((record: { data: string }) => {
      // DNS TXT records may be quoted
      const value = record.data?.replace(/^"|"$/g, "").trim();
      return value === expectedToken;
    });

    if (found) {
      return { verified: true };
    }

    return {
      verified: false,
      error: "TXT record found but value does not match the verification token",
    };
  } catch (err: any) {
    return {
      verified: false,
      error: err.message || "DNS verification failed",
    };
  }
}

/**
 * Check if a domain's A record points to the expected VPS IP.
 * Uses Google DNS-over-HTTPS (public, no key needed).
 */
export async function checkDomainARecord(
  domain: string,
  expectedIp: string
): Promise<{ pointing: boolean; resolvedIps: string[]; error?: string }> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`
    );

    if (!res.ok) {
      return { pointing: false, resolvedIps: [], error: "DNS lookup failed" };
    }

    const data = await res.json();

    if (!data.Answer || data.Answer.length === 0) {
      return { pointing: false, resolvedIps: [], error: "No A record found" };
    }

    const resolvedIps = data.Answer
      .filter((r: { type: number }) => r.type === 1) // A records only
      .map((r: { data: string }) => r.data?.trim());

    const pointing = resolvedIps.includes(expectedIp);
    return { pointing, resolvedIps };
  } catch (err: any) {
    return { pointing: false, resolvedIps: [], error: err.message || "DNS check failed" };
  }
}

/**
 * Notify backend that domain has been verified (optional API call).
 */
export async function markDomainVerified(domainId: string): Promise<void> {
  const token = localStorage.getItem("token");
  await fetch(`${BASE_URL}/admin/domains/${domainId}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
