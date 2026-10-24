"use client";

import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/server/auth";

// Same-origin client: talks to /api/auth/* on whichever host served the page.
export const authClient = createAuthClient({
  plugins: [adminClient(), inferAdditionalFields<typeof auth>()],
});

export const { useSession, signOut } = authClient;
