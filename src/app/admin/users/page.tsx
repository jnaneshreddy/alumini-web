import { UsersWorkspace } from "@/components/users-workspace";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
export default async function UsersPage(){await requireRole("SUPER_ADMIN");const records=await prisma.userProfile.findMany({orderBy:{createdAt:"desc"},select:{id:true,fullName:true,email:true,role:true,active:true,createdAt:true,updatedAt:true}});const users=records.map((user)=>({...user,createdAt:user.createdAt.toISOString(),updatedAt:user.updatedAt.toISOString()}));return <section className="adminRoutePage"><UsersWorkspace users={users}/></section>}
