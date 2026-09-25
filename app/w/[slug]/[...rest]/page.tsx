import { notFound } from "next/navigation";

// Unknown paths under a wedding site show that site's own 404, inside its theme.
export default function UnknownGuestPath() {
  notFound();
}
