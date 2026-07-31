import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const FROM = process.env.EMAIL_FROM || "";
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getClient();
  if (!resend) {
    console.warn(`[mail] RESEND_API_KEY not set — skipped email "${subject}" to ${to}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[mail] Failed to send "${subject}" to ${to}:`, error);
    }
  } catch (err) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, err);
  }
}

function formatNaira(cents: number) {
  return `₦${(cents / 100).toLocaleString("en-NG")}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ASOEBI_FABRIC = "Aso-oke — Burnt Orange & Olive Green";

function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

function invitationCard(innerHtml: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ec;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;border:1px solid #d8cfb4;">
      <tr><td style="padding:40px 36px;text-align:center;font-family:Georgia,'Times New Roman',serif;">
        ${innerHtml}
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export function rsvpConfirmationEmail({
  guestName,
  attending,
  brideName,
  groomName,
  weddingDate,
  location,
  venueAddress,
  bridePhone,
}: {
  guestName: string;
  attending: boolean;
  brideName: string;
  groomName: string;
  weddingDate: Date;
  location?: string | null;
  venueAddress?: string | null;
  bridePhone?: string | null;
}) {
  const formattedDate = weddingDate
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    .toUpperCase();
  const dateLine = location ? `${formattedDate}` : formattedDate;

  const safeGuestName = escapeHtml(guestName);
  const safeBrideName = escapeHtml(brideName);
  const safeGroomName = escapeHtml(groomName);

  const header = `<p style="margin:0 0 18px;font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:#c1440e;">R.S.V.P ${attending ? "Confirmed" : "Received"}</p>
        <h2 style="margin:0 0 4px;font-weight:400;font-size:26px;color:#252a1a;">${safeBrideName} <span style="color:#c1440e;font-style:italic;">&amp;</span> ${safeGroomName}</h2>
        <p style="margin:0 0 26px;font-size:12px;letter-spacing:.14em;color:#6b7a44;">${dateLine}</p>
        <div style="width:36px;height:1px;background:#d8cfb4;margin:0 auto 26px;"></div>`;

  const signature = `<p style="margin:26px 0 0;font-style:italic;font-size:14px;color:#6b7a44;">With love,<br/>${safeBrideName} &amp; ${safeGroomName}</p>`;

  if (!attending) {
    const subject = `We'll miss you, ${guestName}`;
    const html = invitationCard(`${header}
        <p style="margin:0;font-size:15.5px;line-height:1.7;color:#252a1a;">Dear ${safeGuestName},<br/>thank you for letting us know you can't make it on ${formattedDate}. You'll be missed!</p>
        ${signature}`);
    return { subject, html };
  }

  const venueBlock = venueAddress
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ead9;margin:0 0 24px;">
          <tr><td style="padding:20px 22px;text-align:center;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#9c8e6a;">Venue</p>
            <p style="margin:0;font-size:15px;color:#252a1a;">${escapeHtml(venueAddress)}</p>
          </td></tr>
        </table>`
    : "";

  const whatsappBlock = bridePhone
    ? `<a href="https://wa.me/${toWhatsAppNumber(bridePhone)}?text=${encodeURIComponent(
        `Hi ${brideName}! Excited for your big day. I'd like to order my asoebi for the wedding.`
      )}" style="display:inline-block;background:#c1440e;color:#fdf6ec;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;padding:13px 30px;">Order Asoebi on WhatsApp</a>`
    : "";

  const asoebiBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ead9;margin:0 0 24px;">
          <tr><td style="padding:20px 22px;text-align:center;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#9c8e6a;">Asoebi Fabric</p>
            <p style="margin:0;font-size:16px;color:#252a1a;">${ASOEBI_FABRIC}</p>
          </td></tr>
        </table>`;

  const subject = `You're confirmed for ${brideName} & ${groomName}'s wedding`;
  const html = invitationCard(`${header}
        <p style="margin:0 0 22px;font-size:15.5px;line-height:1.7;color:#252a1a;">Dear ${safeGuestName},<br/>we've received your RSVP and can't wait to celebrate with you. Thank you for being part of our day.</p>
        ${venueBlock}
        ${whatsappBlock}
        ${signature}`);

  return { subject, html };
}

function editorialBand({
  eyebrow,
  headline,
  subline,
  bodyHtml,
}: {
  eyebrow: string;
  headline: string;
  subline: string;
  bodyHtml: string;
}) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ec;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
      <tr><td style="background:#252a1a;padding:36px 32px;text-align:center;">
        <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#c1440e;">${eyebrow}</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:40px;color:#fdf6ec;">${headline}</p>
        <p style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#c8cdb4;">${subline}</p>
      </td></tr>
      <tr><td style="padding:30px 32px 34px;font-family:Georgia,'Times New Roman',serif;">
        ${bodyHtml}
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export function contributionNotificationEmail({
  guestName,
  itemName,
  amountCents,
  note,
}: {
  guestName: string;
  itemName: string;
  amountCents: number;
  note?: string | null;
}) {
  const safeGuestName = escapeHtml(guestName);
  const safeItemName = escapeHtml(itemName);
  const subject = `${formatNaira(amountCents)} toward your ${itemName} — from ${guestName}`;

  const noteBlock = note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #c1440e;background:#f0ead9;margin:0 0 26px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-style:italic;font-size:14px;color:#4f5a32;">"${escapeHtml(note)}"</p>
        </td></tr>
      </table>`
    : "";

  const html = editorialBand({
    eyebrow: "New Contribution",
    headline: formatNaira(amountCents),
    subline: `toward the ${safeItemName}`,
    bodyHtml: `<p style="margin:0 0 20px;font-size:15.5px;line-height:1.7;color:#252a1a;"><strong>${safeGuestName}</strong> just sent this your way — one gift closer to the life you're building together.</p>
      ${noteBlock}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#6b7a44;">Confirm the transfer from your <a href="${SITE_URL}/admin" style="color:#c1440e;font-weight:bold;text-decoration:underline;">admin dashboard</a> once it lands.</p>`,
  });

  return { subject, html };
}
