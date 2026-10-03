import type { Metadata } from "next";
import { GalleryArchiveClient } from "@/components/gallery-experience";
import { getGalleryPage } from "@/lib/gallery-data";

export const metadata: Metadata = { title: "Memories & Photo Gallery", description: "Published photographs from school life, events, campus memories and alumni gatherings." };

export default async function GalleryPage({ searchParams }: PageProps<"/gallery">) {
  const data = await getGalleryPage(await searchParams);
  return <GalleryArchiveClient {...data}/>;
}
