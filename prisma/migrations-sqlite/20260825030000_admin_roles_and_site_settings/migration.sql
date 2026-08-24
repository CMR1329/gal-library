ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

CREATE TABLE "AdminLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "detailsJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT
);

CREATE TABLE "SiteSettings" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
  "backgroundImageUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "AdminLog_actorUserId_createdAt_idx" ON "AdminLog"("actorUserId", "createdAt");
CREATE INDEX "AdminLog_action_createdAt_idx" ON "AdminLog"("action", "createdAt");
CREATE INDEX "AdminLog_targetType_targetId_idx" ON "AdminLog"("targetType", "targetId");
