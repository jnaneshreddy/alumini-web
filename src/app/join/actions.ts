"use server";

import { z } from "zod";
import { notifyAdmins } from "@/lib/admin-notifications";
import { prisma } from "@/lib/prisma";

export type JoinState = { error?: string; submitted?: true };

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  registrantType: z.enum(["ALUMNI", "STUDENT", "TEACHER"]),
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(32),
  batch: z.string().trim().min(2, "Enter your batch.").max(60),
  graduationYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
});

export async function submitAlumniRegistration(_: JoinState, formData: FormData): Promise<JoinState> {
  if (String(formData.get("website") ?? "").trim()) return { submitted: true };
  const parsed = registrationSchema.safeParse({
    fullName: formData.get("fullName"),
    registrantType: formData.get("registrantType"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    batch: formData.get("batch"),
    graduationYear: formData.get("graduationYear"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the information and try again." };

  try {
    const existing = await prisma.alumniProfile.findFirst({ where: { email: parsed.data.email }, select: { id: true } });
    if (existing) return { submitted: true };
    const record = await prisma.alumniProfile.create({
      data: { ...parsed.data, verificationStatus: "PENDING", consentToPublish: false, isPublished: false },
    });
    await notifyAdmins({
      title: "New directory registration",
      message: `${record.fullName} submitted a ${record.registrantType.toLowerCase()} registration for review.`,
      topic: "ALUMNI",
      href: "/admin/alumni",
    });
    return { submitted: true };
  } catch (error) {
    console.error("Unable to submit alumni registration", error);
    return { error: "We could not submit your registration right now. Please try again." };
  }
}
