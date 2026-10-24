import type { BadgeTone } from "@/components/ui/Badge";

export const orderStatuses = [
  "PENDING_PAYMENT",
  "PLACED",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export type PaymentMethod = "CARD" | "COD";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

/** Which statuses staff may move an order to from each status. */
export const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PLACED", "CANCELLED"],
  PLACED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const statusTone: Record<OrderStatus, BadgeTone> = {
  PENDING_PAYMENT: "neutral",
  PLACED: "info",
  PROCESSING: "accent",
  OUT_FOR_DELIVERY: "brand",
  DELIVERED: "success",
  CANCELLED: "sale",
  REFUNDED: "neutral",
};

/** Orders still needing staff action. */
export const openStatuses: OrderStatus[] = ["PLACED", "PROCESSING", "OUT_FOR_DELIVERY"];

export function orderNumber(id: number) {
  return `IHC-${100000 + id}`;
}
