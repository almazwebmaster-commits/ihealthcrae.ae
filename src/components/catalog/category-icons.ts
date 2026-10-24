import {
  Baby,
  Dumbbell,
  HeartPulse,
  Pill,
  Sparkles,
  SprayCan,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  "health-medicine": Pill,
  "vitamins-supplements": Zap,
  "beauty-skincare": Sparkles,
  "personal-care": SprayCan,
  "mother-baby": Baby,
  "medical-devices": HeartPulse,
  "sports-nutrition": Dumbbell,
};
