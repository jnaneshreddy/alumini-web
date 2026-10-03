import type { GalleryCategory, GalleryType } from "@prisma/client";

export const galleryCategories: GalleryCategory[] = ["SCHOOL_MEMORIES", "CAMPUS", "EVENTS", "ALUMNI", "REUNIONS", "TEACHERS", "STUDENT_LIFE"];
export const galleryTypes: GalleryType[] = ["PHOTO_GALLERY", "MEMORY"];

export const galleryCategoryLabels: Record<GalleryCategory, { en: string; kn: string }> = {
  SCHOOL_MEMORIES: { en: "School Memories", kn: "ಶಾಲೆಯ ನೆನಪುಗಳು" },
  CAMPUS: { en: "Campus", kn: "ಆವರಣ" },
  EVENTS: { en: "Events", kn: "ಕಾರ್ಯಕ್ರಮಗಳು" },
  ALUMNI: { en: "Alumni", kn: "ಹಳೆಯ ವಿದ್ಯಾರ್ಥಿಗಳು" },
  REUNIONS: { en: "Reunions", kn: "ಪುನರ್ಮಿಲನಗಳು" },
  TEACHERS: { en: "Teachers", kn: "ಶಿಕ್ಷಕರು" },
  STUDENT_LIFE: { en: "Student Life", kn: "ವಿದ್ಯಾರ್ಥಿ ಜೀವನ" },
};

export type PublicGalleryImage = {
  id: string;
  titleEn: string | null;
  titleKn: string | null;
  descriptionEn: string | null;
  descriptionKn: string | null;
  altText: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: GalleryCategory;
  galleryType: GalleryType;
  date: string | null;
};
