import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireSession, canWrite } from "../../../../lib/auth";
import { handleError, jsonError } from "../../../../lib/api";
const schema=z.object({number:z.string().min(2).max(30),type:z.string().min(2).max(50),driverId:z.string().nullable().optional(),active:z.boolean()});
export async function PATCH(req:Request,{params}:{params:{id:string}}){try{const s=await requireSession();if(!canWrite(s.role))return jsonError("Forbidden",403);const b=schema.parse(await req.json());const existing=await prisma.vehicle.findFirst({where:{id:params.id,organizationId:s.organizationId}});if(!existing)return jsonError("Vehicle not found",404);const row=await prisma.vehicle.update({where:{id:params.id},data:{number:b.number.trim().toUpperCase(),type:b.type.trim(),driverId:b.driverId||null,active:b.active}});return NextResponse.json({vehicle:row});}catch(e){return handleError(e)}}
export async function DELETE(_:Request,{params}:{params:{id:string}}){try{const s=await requireSession();if(!canWrite(s.role))return jsonError("Forbidden",403);const existing=await prisma.vehicle.findFirst({where:{id:params.id,organizationId:s.organizationId}});if(!existing)return jsonError("Vehicle not found",404);await prisma.vehicle.update({where:{id:params.id},data:{active:false}});return NextResponse.json({ok:true});}catch(e){return handleError(e)}}
