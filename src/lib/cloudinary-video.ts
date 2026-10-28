/** Videos we store: Cloudinary video uploads (the original, untransformed address). */
export const VIDEO_SRC = /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/(v\d+\/)?[\w\-/.]+\.\w+$/;

/**
 * Derived version of a stored Cloudinary video: `transform` goes right after /video/upload/,
 * `ext` picks the format (mp4 for playback, jpg for a still frame).
 */
export function videoVariant(src: string, transform: string, ext: "mp4" | "jpg") {
  return src.replace("/video/upload/", `/video/upload/${transform}/`).replace(/\.\w+$/, `.${ext}`);
}

/** Silent, compressed clip for a looping background (from `start` to `end` seconds). */
export function loopClip(src: string, start: number, end: number) {
  const range = end > start ? `so_${start},eo_${end},` : "";
  return {
    video: videoVariant(src, `${range}ac_none,vc_auto,q_auto,w_720,c_scale`, "mp4"),
    poster: videoVariant(src, `so_${start},w_1200,c_scale,q_auto`, "jpg"),
  };
}

/** Sponsored ad clip: like a loop clip but keeps the sound (it starts muted, viewers can unmute). */
export function adClip(src: string, start: number, end: number) {
  const range = end > start ? `so_${start},eo_${end},` : "";
  return {
    video: videoVariant(src, `${range}vc_auto,q_auto,w_960,c_scale`, "mp4"),
    poster: videoVariant(src, `so_${start},w_960,c_scale,q_auto`, "jpg"),
  };
}

/** Full video with sound for a player, plus a still frame for its poster/thumbnail. */
export function playerVideo(src: string) {
  return {
    video: videoVariant(src, "vc_auto,q_auto,w_1280,c_scale", "mp4"),
    poster: videoVariant(src, "so_2,w_1200,c_scale,q_auto", "jpg"),
  };
}
