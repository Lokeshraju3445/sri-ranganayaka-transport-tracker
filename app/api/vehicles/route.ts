import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireSession, canWrite } from "../../../lib/auth";
import { handleError, jsonError } from "../../../lib/api";
const schema=z.object({number:z.string().min(2).max(30),type:z.string().min(2).max(50).default("Truck"),driverId:z.string().nullable().optional(),active:z.boolean().default(true)});
export async function GET(){try{const s=await requireSession();const rows=await prisma.vehicle.findMany({where:{organizationId:s.organizationId},include:{driver:true},orderBy:{number:"asc"}});return NextResponse.json({vehicles:rows});}catch(e){return handleError(e)}}
export async function POST(req:Request){try{const s=await requireSession();if(!canWrite(s.role))return jsonError("Forbidden",403);const b=schema.parse(await req.json());const row=await prisma.vehicle.create({data:{organizationId:s.organizationId,number:b.number.trim().toUpperCase(),type:b.type.trim(),driverId:b.driverId||null,active:b.active}});return NextResponse.json({vehicle:row},{status:201});}catch(e){return handleError(e)}}
