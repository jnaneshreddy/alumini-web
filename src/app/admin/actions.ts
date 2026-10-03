"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function signIn(formData: FormData) { const supabase = await createClient(); const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email")), password: String(formData.get("password")) }); if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`); redirect("/admin"); }
export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut(); revalidatePath("/admin", "layout"); redirect("/admin/login"); }
