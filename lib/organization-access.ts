import { prisma } from "./prisma";
import { randomUUID } from "node:crypto";

export type AccessRole = "OWNER" | "MANAGER" | "STAFF";

export async function getMembership(userId: string, organizationId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; userId: string; organizationId: string; role: AccessRole; active: boolean }>>`
    SELECT "id", "userId", "organizationId", "role"::text AS "role", "active"
    FROM "OrganizationMembership"
    WHERE "userId" = ${userId} AND "organizationId" = ${organizationId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getActiveMemberships(userId: string) {
  return prisma.$queryRaw<Array<{ id: string; organizationId: string; role: AccessRole; active: boolean; organizationName: string }>>`
    SELECT m."id", m."organizationId", m."role"::text AS "role", m."active", o."name" AS "organizationName"
    FROM "OrganizationMembership" m
    INNER JOIN "Organization" o ON o."id" = m."organizationId"
    WHERE m."userId" = ${userId} AND m."active" = true AND o."active" = true
    ORDER BY o."name" ASC
  `;
}

export async function ensureMembership(userId: string, organizationId: string, role: AccessRole, active = true) {
  await prisma.$executeRaw`
    INSERT INTO "OrganizationMembership" ("id", "userId", "organizationId", "role", "active", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${organizationId}, ${role}::"UserRole", ${active}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("userId", "organizationId")
    DO UPDATE SET "role" = EXCLUDED."role", "active" = EXCLUDED."active", "updatedAt" = CURRENT_TIMESTAMP
  `;
}
