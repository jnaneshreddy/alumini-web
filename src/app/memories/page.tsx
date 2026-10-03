import type { Metadata } from "next";
import { GalleryArchiveClient } from "@/components/gallery-experience";
import { getGalleryPage } from "@/lib/gallery-data";

export const metadata: Metadata = { title: "Memory Archive", description: "Curated historical and special collections from the MDRS community." };

export default async function MemoriesPage({ searchParams }: PageProps<"/memories">) {
  const data = await getGalleryPage(await searchParams, "MEMORY");
  return <GalleryArchiveClient {...data}/>;
}
