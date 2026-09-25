import "server-only";
import { Resend } from "resend";
import { formatMoney, type MoneyFormat } from "@/lib/money";
import { DEFAULT_PRESET, mixHex, type ThemeColors } from "@/lib/themes";

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

/** Email colors derived from a wedding's theme (inline styles only; no CSS variables in email). */
export type EmailPalette = {
  page: string;
  text: string;
  primary: string;
  accent: string;
  accentDark: string;
  tint: string;
  border: string;
  muted: string;
  bandSubline: string;
};

export function emailPalette(colors: ThemeColors = DEFAULT_PRESET.colors): EmailPalette {
  return {
    page: colors.ivory,
    text: colors.foreground,
    primary: colors.primary,
    accent: colors.accent,
    accentDark: colors.accentDark,
    tint: colors.cream,
    border: mixHex(colors.cream, colors.accent, 0.2),
    muted: mixHex(colors.foreground, colors.cream, 0.45),
    bandSubline: mixHex(colors.ivory, colors.accent, 0.25),
  };
}

const PLATFORM_PALETTE = emailPalette();

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { toWhatsAppNumber } from "@/lib/phone";

export { toWhatsAppNumber };

function invitationCard(innerHtml: string, p: EmailPalette) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.page};padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;border:1px solid ${p.border};">
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
  phoneCountryCode,
  asoebi,
  palette: p,
}: {
  guestName: string;
  attending: boolean;
  brideName: string;
  groomName: string;
  weddingDate: Date;
  location?: string | null;
  venueAddress?: string | null;
  bridePhone?: string | null;
  phoneCountryCode: string;
  asoebi: { enabled: boolean; fabric: string | null };
  palette: EmailPalette;
}) {
  const formattedDate = weddingDate
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    .toUpperCase();
  const dateLine = location ? `${formattedDate}` : formattedDate;

  const safeGuestName = escapeHtml(guestName);
  const safeBrideName = escapeHtml(brideName);
  const safeGroomName = escapeHtml(groomName);

  const header = `<p style="margin:0 0 18px;font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:${p.primary};">R.S.V.P ${attending ? "Confirmed" : "Received"}</p>
        <h2 style="margin:0 0 4px;font-weight:400;font-size:26px;color:${p.text};">${safeBrideName} <span style="color:${p.primary};font-style:italic;">&amp;</span> ${safeGroomName}</h2>
        <p style="margin:0 0 26px;font-size:12px;letter-spacing:.14em;color:${p.accent};">${dateLine}</p>
        <div style="width:36px;height:1px;background:${p.border};margin:0 auto 26px;"></div>`;

  const signature = `<p style="margin:26px 0 0;font-style:italic;font-size:14px;color:${p.accent};">With love,<br/>${safeBrideName} &amp; ${safeGroomName}</p>`;

  if (!attending) {
    const subject = `We'll miss you, ${guestName}`;
    const html = invitationCard(`${header}
        <p style="margin:0;font-size:15.5px;line-height:1.7;color:${p.text};">Dear ${safeGuestName},<br/>thank you for letting us know you can't make it on ${formattedDate}. You'll be missed!</p>
        ${signature}`, p);
    return { subject, html };
  }

  const venueBlock = venueAddress
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.tint};margin:0 0 24px;">
          <tr><td style="padding:20px 22px;text-align:center;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${p.muted};">Venue</p>
            <p style="margin:0;font-size:15px;color:${p.text};">${escapeHtml(venueAddress)}</p>
          </td></tr>
        </table>`
    : "";

  const whatsappBlock = asoebi.enabled && bridePhone
    ? `<a href="https://wa.me/${toWhatsAppNumber(bridePhone, phoneCountryCode)}?text=${encodeURIComponent(
        `Hi ${brideName}! Excited for your big day. I'd like to order my asoebi for the wedding.`
      )}" style="display:inline-block;background:${p.primary};color:${p.page};font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;padding:13px 30px;">Order Asoebi on WhatsApp</a>`
    : "";

  const asoebiBlock = asoebi.enabled && asoebi.fabric
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.tint};margin:0 0 24px;">
          <tr><td style="padding:20px 22px;text-align:center;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${p.muted};">Asoebi Fabric</p>
            <p style="margin:0;font-size:16px;color:${p.text};">${escapeHtml(asoebi.fabric)}</p>
          </td></tr>
        </table>`
    : "";

  const subject = `You're confirmed for ${brideName} & ${groomName}'s wedding`;
  const html = invitationCard(`${header}
        <p style="margin:0 0 22px;font-size:15.5px;line-height:1.7;color:${p.text};">Dear ${safeGuestName},<br/>we've received your RSVP and can't wait to celebrate with you. Thank you for being part of our day.</p>
        ${venueBlock}
        ${asoebiBlock}
        ${whatsappBlock}
        ${signature}`, p);

  return { subject, html };
}

function editorialBand({
  eyebrow,
  headline,
  subline,
  bodyHtml,
  palette: p = PLATFORM_PALETTE,
}: {
  eyebrow: string;
  headline: string;
  subline: string;
  bodyHtml: string;
  palette?: EmailPalette;
}) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.page};padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
      <tr><td style="background:${p.text};padding:36px 32px;text-align:center;">
        <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:${p.primary};">${eyebrow}</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:40px;color:${p.page};">${headline}</p>
        <p style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${p.bandSubline};">${subline}</p>
      </td></tr>
      <tr><td style="padding:30px 32px 34px;font-family:Georgia,'Times New Roman',serif;">
        ${bodyHtml}
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export function contributionNotificationEmail({
  weddingId,
  guestName,
  itemName,
  amountCents,
  note,
  money,
  palette: p,
}: {
  weddingId: string;
  guestName: string;
  itemName: string;
  amountCents: number;
  note?: string | null;
  money: MoneyFormat;
  palette: EmailPalette;
}) {
  const safeGuestName = escapeHtml(guestName);
  const safeItemName = escapeHtml(itemName);
  const subject = `${formatMoney(amountCents, money)} toward your ${itemName} — from ${guestName}`;

  const noteBlock = note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${p.primary};background:${p.tint};margin:0 0 26px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-style:italic;font-size:14px;color:${p.accentDark};">"${escapeHtml(note)}"</p>
        </td></tr>
      </table>`
    : "";

  const html = editorialBand({
    palette: p,
    eyebrow: "New Contribution",
    headline: formatMoney(amountCents, money),
    subline: `toward the ${safeItemName}`,
    bodyHtml: `<p style="margin:0 0 20px;font-size:15.5px;line-height:1.7;color:${p.text};"><strong>${safeGuestName}</strong> just sent this your way — one gift closer to the life you're building together.</p>
      ${noteBlock}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:${p.accent};">Confirm the transfer from your <a href="${SITE_URL}/dashboard/${encodeURIComponent(weddingId)}" style="color:${p.primary};font-weight:bold;text-decoration:underline;">admin dashboard</a> once it lands.</p>`,
  });

  return { subject, html };
}

function accountActionBody(message: string, cta: string, url: string, footnote: string) {
  return `<p style="margin:0 0 24px;font-size:15.5px;line-height:1.7;color:#252a1a;">${message}</p>
      <p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:#c1440e;color:#fdf6ec;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;">${cta}</a></p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#6b7a44;">${footnote}</p>`;
}

export function passwordResetEmail({ token }: { token: string }) {
  const url = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    subject: "Reset your password",
    html: editorialBand({
      eyebrow: "Account",
      headline: "Reset your password",
      subline: "",
      bodyHtml: accountActionBody(
        "Someone (hopefully you) asked to reset the password for your wedding dashboard.",
        "Choose a new password",
        url,
        "This link works once and expires in an hour. If you didn't ask for it, you can ignore this email."
      ),
    }),
  };
}

export function inviteEmail({ token, weddingName }: { token: string; weddingName: string | null }) {
  const url = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const safeName = weddingName ? escapeHtml(weddingName) : null;
  return {
    subject: safeName ? `You're invited to manage ${weddingName}'s wedding site` : "Your wedding dashboard is ready",
    html: editorialBand({
      eyebrow: "Invitation",
      headline: "Welcome aboard",
      subline: safeName ? `to ${safeName}'s wedding dashboard` : "",
      bodyHtml: accountActionBody(
        "Set a password to start managing RSVPs, the registry and your wedding site.",
        "Set your password",
        url,
        "This link works once and expires in 7 days."
      ),
    }),
  };
}
