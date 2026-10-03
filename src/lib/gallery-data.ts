import "server-only";

import type { GalleryCategory, GalleryType, Prisma } from "@prisma/client";
import { galleryCategories, galleryTypes, type PublicGalleryImage } from "@/lib/gallery";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 24;

export async function getGalleryPage(searchParams: Record<string, string | string[] | undefined>, forcedType?: GalleryType) {
  const categoryInput = typeof searchParams.category === "string" ? searchParams.category : "ALL";
  const selectedCategory = galleryCategories.includes(categoryInput as GalleryCategory) ? categoryInput as GalleryCategory : "ALL";
  const typeInput = typeof searchParams.type === "string" ? searchParams.type : "all";
  const galleryType = forcedType || (galleryTypes.includes(typeInput as GalleryType) ? typeInput as GalleryType : undefined);
  const pageInput = typeof searchParams.page === "string" ? Number.parseInt(searchParams.page, 10) : 1;
  const currentPage = Number.isFinite(pageInput) && pageInput > 0 ? pageInput : 1;
  const where: Prisma.GalleryImageWhereInput = { isPublished: true, ...(selectedCategory !== "ALL" ? { category: selectedCategory } : {}), ...(galleryType ? { galleryType } : {}) };
  const [records, total] = await Promise.all([
    prisma.galleryImage.findMany({ where, orderBy: [{ sortOrder: "asc" }, { date: "desc" }, { createdAt: "desc" }], skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.galleryImage.count({ where }),
  ]).catch(() => [[], 0] as const);
  const images: PublicGalleryImage[] = records.map((image) => ({ id: image.id, titleEn: image.titleEn, titleKn: image.titleKn, descriptionEn: image.descriptionEn, descriptionKn: image.descriptionKn, altText: image.altText, imageUrl: image.imageUrl, thumbnailUrl: image.thumbnailUrl, category: image.category, galleryType: image.galleryType, date: image.date?.toISOString() ?? null }));
  return { images, selectedCategory, currentPage, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), galleryType: galleryType || "all" };
}
