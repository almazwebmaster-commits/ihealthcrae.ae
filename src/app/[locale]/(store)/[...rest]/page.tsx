import { notFound } from "next/navigation";

// Routes any unknown path to the localized not-found page.
export default function CatchAll() {
  notFound();
}
