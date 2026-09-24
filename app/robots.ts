import type { MetadataRoute } from "next";

// Marketing pages are public; couples' sites, dashboards and auth pages are not indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/pricing"],
      disallow: ["/w/", "/dashboard", "/super", "/api/", "/login", "/signup", "/forgot-password", "/reset-password"],
    },
  };
}
