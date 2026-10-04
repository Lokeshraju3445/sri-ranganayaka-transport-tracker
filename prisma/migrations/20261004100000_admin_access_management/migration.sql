ALTER TABLE "Organization" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "OrganizationMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STAFF',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationMembership_userId_organizationId_key" ON "OrganizationMembership"("userId", "organizationId");
CREATE INDEX "OrganizationMembership_userId_active_idx" ON "OrganizationMembership"("userId", "active");
CREATE INDEX "OrganizationMembership_organizationId_active_idx" ON "OrganizationMembership"("organizationId", "active");

ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill the current single-organization access model into memberships.
INSERT INTO "OrganizationMembership" ("id", "userId", "organizationId", "role", "active", "createdAt", "updatedAt")
SELECT md5("User"."id" || ':' || "User"."organizationId"), "User"."id", "User"."organizationId", "User"."role", "User"."active", "User"."createdAt", CURRENT_TIMESTAMP
FROM "User";
