// Triggers the subscription renewal runner on the running app.
//   npm run subscriptions:renew
import "dotenv/config";

const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const res = await fetch(`${base}/api/cron/subscriptions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
});
console.log(res.status, JSON.stringify(await res.json(), null, 2));
