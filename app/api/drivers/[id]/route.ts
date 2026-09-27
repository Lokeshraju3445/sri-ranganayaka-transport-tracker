import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireSession, canWrite } from "../../../../lib/auth";
import { handleError, jsonError } from "../../../../lib/api";
const schema=z.object({name:z.string().min(2).max(100),phone:z.string().max(30).optional().nullable(),active:z.boolean()});
export async function PATCH(req:Request,{params}:{params:{id:string}}){try{const s=await requireSession();if(!canWrite(s.role))return jsonError("Forbidden",403);const b=schema.parse(await req.json());const existing=await prisma.driver.findFirst({where:{id:params.id,organizationId:s.organizationId}});if(!existing)return jsonError("Driver not found",404);const row=await prisma.driver.update({where:{id:params.id},data:{name:b.name.trim(),phone:b.phone?.trim()||null,active:b.active}});return NextResponse.json({driver:row});}catch(e){return handleError(e)}}
export async function DELETE(_:Request,{params}:{params:{id:string}}){try{const s=await requireSession();if(!canWrite(s.role))return jsonError("Forbidden",403);const existing=await prisma.driver.findFirst({where:{id:params.id,organizationId:s.organizationId}});if(!existing)return jsonError("Driver not found",404);await prisma.driver.update({where:{id:params.id},data:{active:false}});return NextResponse.json({ok:true});}catch(e){return handleError(e)}}
