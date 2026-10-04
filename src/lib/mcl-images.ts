export const MCL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MCL_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateMclImageBasics(file: File | null, required = false) {
  if (!file || file.size === 0) return required ? "Choose an image to upload." : null;
  if (!allowed.has(file.type)) return "Only JPG, PNG and WebP images are supported.";
  if (file.size > MCL_IMAGE_MAX_BYTES) return "Image is too large. Please select an image smaller than 5 MB.";
  return null;
}

export async function validateMclImage(file: File | null, required = false) {
  const basicError = validateMclImageBasics(file, required);
  if (basicError || !file || file.size === 0) return basicError;
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if ((file.type === "image/jpeg" && !jpeg) || (file.type === "image/png" && !png) || (file.type === "image/webp" && !webp)) return "This image appears to be corrupted or its file type is incorrect.";
  return null;
}

export async function validateMclImageInBrowser(file: File) {
  const error = validateMclImageBasics(file, true);
  if (error) return error;
  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return null;
  } catch {
    return "This image could not be read. Please choose a valid JPG, PNG or WebP image.";
  }
}
