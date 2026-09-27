import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireSession, canWrite } from "../../../lib/auth";
import { handleError, asNumber, jsonError } from "../../../lib/api";
const schema = z.object({ date:z.string(), vehicleId:z.string().min(1), driverId:z.string().nullable().optional(), customerId:z.string().nullable().optional(), from:z.string().min(1).max(150), to:z.string().min(1).max(150), rate:z.number().nonnegative().default(0), weight:z.number().nonnegative().default(0), amount:z.number().nonnegative(), advance:z.number().nonnegative().default(0), diesel:z.number().nonnegative().default(0), toll:z.number().nonnegative().default(0), driverSalary:z.number().nonnegative().default(0), status:z.enum(["PLANNED","IN_TRANSIT","DELIVERED","CANCELLED"]).default("PLANNED") });
function serialize(l:any){ const rate=Number(l.rate), weight=Number(l.weight), amount=Number(l.amount), advance=Number(l.advance), diesel=Number(l.diesel), toll=Number(l.toll), driverSalary=Number(l.driverSalary); return {...l,rate,weight,amount,advance,diesel,toll,driverSalary,totalExpenses:diesel+toll+driverSalary,profit:amount-diesel-toll-driverSalary,balanceReceivable:amount-advance}; }
export async function GET(req:Request){
  try{
    const s=await requireSession();
    const u=new URL(req.url);
    const q=u.searchParams.get("q")||undefined;
    const from=u.searchParams.get("from");
    const to=u.searchParams.get("to");
    const where:any={organizationId:s.organizationId};
    if(q) where.OR=[
      {vehicle:{number:{contains:q,mode:"insensitive"}}},
      {from:{contains:q,mode:"insensitive"}},
      {to:{contains:q,mode:"insensitive"}}
    ];
    if(from||to) where.date={
      ...(from?{gte:new Date(from+"T00:00:00.000Z")} : {}),
      ...(to?{lte:new Date(to+"T23:59:59.999Z")} : {})
    };
    const rows=await prisma.load.findMany({where,include:{vehicle:true,driver:true,customer:true},orderBy:{date:"desc"}});
    return NextResponse.json({loads:rows.map(serialize)});
  }catch(e){return handleError(e)}
}
export async function POST(req:Request){try{const s=await requireSession();if(!canWrite(s.role))return jsonError("Forbidden",403);const body=schema.parse(await req.json());const vehicle=await prisma.vehicle.findFirst({where:{id:body.vehicleId,organizationId:s.organizationId,active:true}});if(!vehicle)return jsonError("Vehicle not found",404);
    if(body.driverId){const driver=await prisma.driver.findFirst({where:{id:body.driverId,organizationId:s.organizationId,active:true}});if(!driver)return jsonError("Driver not found",404);}
    if(body.customerId){const customer=await prisma.customer.findFirst({where:{id:body.customerId,organizationId:s.organizationId,active:true}});if(!customer)return jsonError("Customer not found",404);}
    const row=await prisma.load.create({data:{organizationId:s.organizationId,date:new Date(body.date+"T00:00:00.000Z"),vehicleId:body.vehicleId,driverId:body.driverId||null,customerId:body.customerId||null,from:body.from.trim(),to:body.to.trim(),rate:asNumber(body.rate,"rate"),weight:asNumber(body.weight,"weight"),amount:asNumber(body.amount,"amount"),advance:asNumber(body.advance,"advance"),diesel:asNumber(body.diesel,"diesel"),toll:asNumber(body.toll,"toll"),driverSalary:asNumber(body.driverSalary,"driverSalary"),status:body.status},include:{vehicle:true,driver:true,customer:true}});return NextResponse.json({load:serialize(row)},{status:201});}catch(e){return handleError(e)}}
