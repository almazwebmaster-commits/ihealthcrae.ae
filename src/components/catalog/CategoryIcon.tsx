import type { LucideProps } from "lucide-react";
import { HeartHandshake } from "lucide-react";
import { categoryIcons } from "./category-icons";

/** Icon for a top-level category; categories created later in the admin get a generic one. */
export function CategoryIcon({ slug, ...props }: LucideProps & { slug: string }) {
  const Icon = categoryIcons[slug] ?? HeartHandshake;
  return <Icon {...props} />;
}
