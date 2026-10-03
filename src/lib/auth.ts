import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
export async function requireAdmin() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/admin/login"); const profile = await prisma.userProfile.upsert({ where: { authUserId: user.id }, update: { email: user.email ?? "" }, create: { authUserId: user.id, email: user.email ?? `${user.id}@local`, fullName: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Administrator" } }); if (!profile.active || profile.role === "VIEWER") redirect("/admin/login?error=Your%20account%20does%20not%20have%20admin%20access"); return profile; }
