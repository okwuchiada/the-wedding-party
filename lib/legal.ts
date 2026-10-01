/** Plain-language policy content, shown on /terms, /privacy, and the signup modal. */

export type LegalSection = { heading: string; body: string[] };
export type LegalDocument = { title: string; updated: string; intro: string; sections: LegalSection[] };

export const TERMS: LegalDocument = {
  title: "Terms of Service",
  updated: "25 September 2026",
  intro:
    "These are the terms for using Vowly to build a wedding site, and for guests who visit one. By creating an account or using a Vowly site, you agree to them.",
  sections: [
    {
      heading: "What Vowly is",
      body: [
        "Vowly lets a couple build a wedding website: an RSVP form, a gift registry, a photo wall, and their story, all under one link they share with guests.",
        "Guests don't need an account to use a couple's site. They open the link, RSVP, send wishes, contribute to gifts, and upload photos directly.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "You're responsible for keeping your password private and for what happens under your account. Tell us if you think someone else has access to it.",
        "You can invite your partner to help manage your site; anything they change is treated as done with your permission.",
        "We may suspend or remove a site that breaks these terms, is used to harass or defraud guests, or is inactive long after its wedding date has passed.",
      ],
    },
    {
      heading: "Gifts and money",
      body: [
        "Vowly never holds, moves, or has access to your money. When a guest contributes to your registry, they send it directly to your own bank account and tell your site what it was for.",
        "You're responsible for confirming a contribution actually arrived before marking it received. We aren't a party to that transfer and can't reverse, guarantee, or dispute it.",
        "Paid plans are billed once per wedding through our payment processor, Paystack. We don't store your card details ourselves.",
      ],
    },
    {
      heading: "What guests post",
      body: [
        "Photos, videos and wishes that guests submit are moderated by the couple before they're shown publicly; the couple can remove anything at any time.",
        "Don't upload anything you don't have the right to share, or anything that could embarrass or endanger someone at the event.",
      ],
    },
    {
      heading: "Content ownership",
      body: [
        "You keep ownership of your story, photos, and everything else you or your guests add. You're giving us permission to store and display it as part of running your site, nothing more.",
      ],
    },
    {
      heading: "No guarantees",
      body: [
        "We work to keep sites available, especially around a wedding date, but we can't promise the service will never go down or lose data, and we're not liable for losses that come from an outage, a guest's mistaken transfer, or content a couple or guest posts.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "We may update these terms as the product changes. If a change is significant, we'll let account holders know before it takes effect.",
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: "Privacy Policy",
  updated: "25 September 2026",
  intro: "This explains what information Vowly collects, why, and how you can control it.",
  sections: [
    {
      heading: "What we collect",
      body: [
        "From couples: your name, your partner's name, email address, and whatever you choose to add to your site — your story, photos, colours, and your bank details for the registry (shown only to guests, never processed by us).",
        "From guests: whatever they submit to a couple's site directly — an RSVP, a name, a wish, a photo, or a note tied to a gift contribution. Guests aren't required to create an account.",
        "Automatically: basic technical information like IP address and device type, used for security (rate-limiting, fraud prevention) and to keep a site working correctly.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "To run the site you asked for: showing your content to guests, recording RSVPs and contributions, and sending account emails like password resets.",
        "To keep accounts and payments secure, including detecting abuse and enforcing rate limits.",
        "We don't sell your information or a guest's information to third parties, and we don't use it for advertising.",
      ],
    },
    {
      heading: "Who can see it",
      body: [
        "Anything you publish is visible to anyone with your site's link, unless you've set a country restriction or access code.",
        "Our support staff can view a wedding's details to help with a support request or a billing issue; every staff access is logged.",
        "We share payment details with Paystack only as needed to process a plan purchase, and bank details you enter for your registry are shown to your guests, never to us for processing.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "We keep your site's data for as long as your account is active. If a free site stays unpublished and untouched for a long time, or a paid site's access period ends, we may archive or remove it after giving notice.",
      ],
    },
    {
      heading: "Your choices",
      body: [
        "You can edit or delete most of your content directly from your dashboard at any time.",
        "You can ask us to delete your account and its data; we'll do so unless we're required to keep something (like payment records) for legal reasons.",
        "Guests can ask the couple whose site they used to remove something they posted.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "If we change this policy in a way that matters, we'll let account holders know before it takes effect.",
      ],
    },
  ],
};
