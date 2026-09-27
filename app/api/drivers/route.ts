import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireSession, canWrite } from "../../../lib/auth";
import { handleError, jsonError } from "../../../lib/api";
const schema=z.object({name:z.string().min(2).max(100),phone:z.string().max(30).optional().nullable(),active:z.boolean().default(true)});
export async function GET(){try{const s=await requireSession();const rows=await prisma.driver.findMany({where:{organizationId:s.organizationId},include:{vehicles:true},orderBy:{name:"asc"}});return NextResponse.json({drivers:rows});}catch(e){return handleError(e)}}
export async function POST(req:Request){try{const s=await requireSession();if(!canWrite(s.role))return jsonError("Forbidden",403);const b=schema.parse(await req.json());const row=await prisma.driver.create({data:{organizationId:s.organizationId,name:b.name.trim(),phone:b.phone?.trim()||null,active:b.active}});return NextResponse.json({driver:row},{status:201});}catch(e){return handleError(e)}}
