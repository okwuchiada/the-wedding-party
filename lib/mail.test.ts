import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { contributionNotificationEmail, emailPalette, rsvpConfirmationEmail, toWhatsAppNumber } = await import("@/lib/mail");
const { THEME_PRESETS } = await import("@/lib/themes");

const rsvp = {
  guestName: "Jane <b>",
  attending: true,
  brideName: "Ada",
  groomName: "Tobi",
  weddingDate: new Date("2026-12-19T14:00:00Z"),
  bridePhone: "0803 123 4567",
  phoneCountryCode: "234",
  palette: emailPalette(),
};

describe("emails", () => {
  it("uses the wedding's country code for WhatsApp links", () => {
    expect(toWhatsAppNumber("0803 123 4567", "234")).toBe("2348031234567");
    expect(toWhatsAppNumber("07911 123456", "44")).toBe("447911123456");
  });

  it("only shows asoebi when the wedding turns it on", () => {
    const off = rsvpConfirmationEmail({ ...rsvp, asoebi: { enabled: false, fabric: "Aso-oke" } });
    expect(off.html).not.toMatch(/Asoebi/);
    const on = rsvpConfirmationEmail({ ...rsvp, asoebi: { enabled: true, fabric: "Aso-oke" } });
    expect(on.html).toMatch(/Order Asoebi/);
    expect(on.html).toMatch(/Aso-oke/);
    expect(on.html).toContain("wa.me/2348031234567");
  });

  it("escapes guest input", () => {
    expect(rsvpConfirmationEmail({ ...rsvp, asoebi: { enabled: false, fabric: null } }).html).toContain("Jane &lt;b&gt;");
  });

  it("uses the wedding's colors and currency", () => {
    const navy = THEME_PRESETS.find((t) => t.key === "navy-gold")!;
    const { subject, html } = contributionNotificationEmail({
      weddingId: "w1",
      guestName: "Bola",
      itemName: "Kettle",
      amountCents: 2500,
      money: { currency: "USD", locale: "en-US" },
      palette: emailPalette(navy.colors),
    });
    expect(subject).toMatch(/^\$25 toward your Kettle/);
    expect(html).toContain(navy.colors.primary);
    expect(html).not.toContain("#c1440e");
  });
});
