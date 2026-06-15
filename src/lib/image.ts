// Compression/redimensionnement d'image côté client avant upload.
// Évite de dépasser la limite de corps des Server Actions (et le plafond
// de 4,5 Mo des fonctions Vercel) + allège les images servies aux membres.
// Client-only (utilise document / createImageBitmap).

export async function compresserImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file; // garde l'original si pas plus léger
    const nom = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], nom, { type: "image/jpeg" });
  } catch {
    return file; // format non décodable (ex. HEIC) → on laisse l'original
  }
}
