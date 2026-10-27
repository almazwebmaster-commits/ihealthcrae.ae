/** Stock state shared by admin pages (server) and rows (client). */
export function stockState(stock: number, lowStockAt: number) {
  return stock === 0 ? "out" : stock <= lowStockAt ? "low" : "ok";
}
