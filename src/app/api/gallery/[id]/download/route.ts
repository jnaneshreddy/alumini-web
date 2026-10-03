import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "alumini";

export async function GET(_request: Request, { params }: RouteContext<"/api/gallery/[id]/download">) {
  const { id } = await params;
  const image = await prisma.galleryImage.findFirst({ where: { id, isPublished: true } });
  if (!image) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  if (image.storagePath) {
    const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUrl(image.storagePath, 60, { download: true });
    if (!error && data?.signedUrl) return NextResponse.redirect(data.signedUrl);
  }
  return NextResponse.redirect(image.imageUrl);
}
