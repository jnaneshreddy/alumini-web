"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";
export async function deleteFeedback(formData: FormData){const profile=await requireRole(...adminRoles);const id=String(formData.get("id")??"");if(!id)return;const feedback=await prisma.feedback.findUnique({where:{id},select:{id:true,referenceId:true,fullName:true}});if(!feedback)return;await prisma.$transaction([prisma.feedback.delete({where:{id}}),prisma.auditLog.create({data:{userId:profile.id,action:"DELETE_FEEDBACK",entityType:"Feedback",entityId:feedback.id,oldData:{referenceId:feedback.referenceId,fullName:feedback.fullName}}})]);revalidatePath("/admin");revalidatePath("/admin/feedback");revalidatePath("/admin/activity")}
