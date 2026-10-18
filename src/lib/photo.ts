/* Photos are prepared in the browser before upload: shrunk to at most 1000 px and compressed.
   Product photos are cropped to a square; a QR code photo is kept whole (crop = false). */
export async function preparePhoto(file: File, crop = true): Promise<Blob> {
  let source: CanvasImageSource, w: number, h: number;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    source = bmp; w = bmp.width; h = bmp.height;
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('photo')); img.src = url; });
    URL.revokeObjectURL(url);
    source = img; w = img.naturalWidth; h = img.naturalHeight;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('photo');
  if (crop) {
    const side = Math.min(w, h), size = Math.min(1000, side);
    canvas.width = canvas.height = size;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  } else {
    const scale = Math.min(1, 1000 / Math.max(w, h));
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }
  const encode = (type: string, q: number) => new Promise<Blob | null>(r => canvas.toBlob(r, type, q));
  if (!crop) {
    // QR codes stay sharpest as PNG.
    const png = await encode('image/png', 1);
    if (png && png.size < 1_400_000) return png;
  }
  for (const q of [0.84, 0.72, 0.6]) {
    let blob = await encode('image/webp', q);
    if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg', q);
    if (blob && blob.size < 1_400_000) return blob;
  }
  throw new Error('photo');
}

/* Upload a prepared photo; returns its id and URL. */
export async function uploadPhoto(blob: Blob): Promise<{ id: string; url: string }> {
  const res = await fetch('/api/admin/image/', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': blob.type }, body: blob });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not save the photo.');
  return data;
}
