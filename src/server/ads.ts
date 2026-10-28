import "server-only";
import { cache } from "react";
import type { Product } from "@/lib/catalog-types";
import { adClip } from "@/lib/cloudinary-video";
import { getProduct } from "./catalog";
import { getHomeContent } from "./home-content";

export type VideoAd = {
  product: Product;
  video: { video: string; poster: string };
  headline: { en: string; ar: string };
  inListings: boolean;
};

/** The sponsored video ad set in Admin › Homepage, or null when it has no video or its product isn't on sale. */
export const getVideoAd = cache(async (): Promise<VideoAd | null> => {
  const { videoAd } = await getHomeContent();
  if (!videoAd.video || !videoAd.productSlug) return null;
  const product = await getProduct(videoAd.productSlug);
  if (!product) return null;
  return {
    product,
    video: adClip(videoAd.video.src, videoAd.video.start, videoAd.video.end),
    headline: { en: videoAd.headlineEn, ar: videoAd.headlineAr || videoAd.headlineEn },
    inListings: videoAd.inListings,
  };
});
