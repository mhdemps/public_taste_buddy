/** Keep wall JSON payloads reasonable when stored as data URLs in `public_recipes.json`. */
const MAX_DATA_URL_LENGTH = 900_000;
const MAX_ORIGINAL_BYTES = 12 * 1024 * 1024;
const MAX_EDGE_FIRST = 1200;
const MAX_EDGE_FALLBACK = 800;

function toJpegDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Resize and compress a user photo to a JPEG data URL for embedding in recipe JSON.
 */
export async function compressImageFileToDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/") || file.size > MAX_ORIGINAL_BYTES) {
    return null;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  try {
    let maxEdge = MAX_EDGE_FIRST;
    for (let attempt = 0; attempt < 3; attempt++) {
      let w = bitmap.width;
      let h = bitmap.height;
      if (w > maxEdge || h > maxEdge) {
        const scale = maxEdge / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, w, h);

      let quality = 0.88;
      let dataUrl = toJpegDataUrl(canvas, quality);
      while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.42) {
        quality -= 0.07;
        dataUrl = toJpegDataUrl(canvas, quality);
      }

      if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
        return dataUrl;
      }

      maxEdge = MAX_EDGE_FALLBACK;
      if (attempt === 1) maxEdge = 640;
    }
    return null;
  } finally {
    bitmap.close?.();
  }
}
