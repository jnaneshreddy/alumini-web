import { UsersWorkspace } from "@/components/users-workspace";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";
export default async function UsersPage(){const actor=await requireRole(...adminRoles);const records=await prisma.userProfile.findMany({orderBy:{createdAt:"desc"},select:{id:true,fullName:true,email:true,role:true,active:true,phone:true,batch:true,createdAt:true,updatedAt:true}});const users=records.map((user)=>({...user,createdAt:user.createdAt.toISOString(),updatedAt:user.updatedAt.toISOString()}));return <section className="adminRoutePage"><UsersWorkspace users={users} currentUserId={actor.id} currentRole={actor.role}/></section>}
