export const MAX_TEACHER_IMAGE_SIZE_MB = 5;
export const MAX_TEACHER_IMAGE_SIZE_BYTES = MAX_TEACHER_IMAGE_SIZE_MB * 1024 * 1024;
export const TEACHER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const TEACHER_IMAGE_ACCEPT = TEACHER_IMAGE_TYPES.join(",");

export function validateTeacherImage(file: File | null, required: boolean): string | null {
  if (!file || file.size === 0) return required ? "Choose a teacher photograph." : null;
  if (!TEACHER_IMAGE_TYPES.includes(file.type as (typeof TEACHER_IMAGE_TYPES)[number])) {
    return "Only JPG, PNG and WebP images are supported.";
  }
  if (file.size > MAX_TEACHER_IMAGE_SIZE_BYTES) {
    return `Image is too large. Please select an image smaller than ${MAX_TEACHER_IMAGE_SIZE_MB} MB.`;
  }
  return null;
}
