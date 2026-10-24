import { redirect } from "next/navigation";

/** Short link used by the header — the wishlist lives in the account area. */
export default async function WishlistRedirect({ params }: PageProps<"/[locale]/wishlist">) {
  redirect(`/${(await params).locale}/account/wishlist`);
}
