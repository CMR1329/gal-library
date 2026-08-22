CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleCn" TEXT,
    "titleCnSource" TEXT,
    "originalTitle" TEXT,
    "alternateTitles" TEXT NOT NULL DEFAULT '[]',
    "coverUrl" TEXT,
    "bannerUrl" TEXT,
    "description" TEXT,
    "releaseDate" TEXT,
    "endDate" TEXT,
    "releaseYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "displayName" TEXT,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "profileVisibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExternalMetadata" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "rawJson" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalMetadata_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExternalReference" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalReference_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "score" DOUBLE PRECISION,
    "progressCurrent" INTEGER,
    "progressTotal" INTEGER,
    "progressText" TEXT,
    "startedAt" TEXT,
    "completedAt" TEXT,
    "activityYear" INTEGER,
    "rewatchCount" INTEGER NOT NULL DEFAULT 0,
    "plannedRewatch" BOOLEAN NOT NULL DEFAULT false,
    "playtimeMinutes" INTEGER,
    "completedAllRoutes" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "customDataJson" TEXT NOT NULL DEFAULT '{}',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserEntry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserEntryTag" (
    "userEntryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "UserEntryTag_pkey" PRIMARY KEY ("userEntryId","tagId")
);
CREATE TABLE "RouteProgress" (
    "id" TEXT NOT NULL,
    "userEntryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RouteProgress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Media_mediaType_idx" ON "Media"("mediaType");
CREATE INDEX "Media_title_idx" ON "Media"("title");
CREATE INDEX "Media_titleCn_idx" ON "Media"("titleCn");
CREATE INDEX "Media_releaseYear_idx" ON "Media"("releaseYear");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_issuer_accountId_key" ON "Account"("issuer","accountId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE UNIQUE INDEX "ExternalMetadata_mediaId_key" ON "ExternalMetadata"("mediaId");
CREATE INDEX "ExternalMetadata_source_idx" ON "ExternalMetadata"("source");
CREATE UNIQUE INDEX "ExternalMetadata_source_externalId_key" ON "ExternalMetadata"("source","externalId");
CREATE INDEX "ExternalReference_mediaId_idx" ON "ExternalReference"("mediaId");
CREATE UNIQUE INDEX "ExternalReference_source_externalId_key" ON "ExternalReference"("source","externalId");
CREATE INDEX "UserEntry_status_idx" ON "UserEntry"("status");
CREATE INDEX "UserEntry_score_idx" ON "UserEntry"("score");
CREATE INDEX "UserEntry_addedAt_idx" ON "UserEntry"("addedAt");
CREATE INDEX "UserEntry_completedAt_idx" ON "UserEntry"("completedAt");
CREATE INDEX "UserEntry_userId_activityYear_idx" ON "UserEntry"("userId","activityYear");
CREATE INDEX "UserEntry_userId_status_idx" ON "UserEntry"("userId","status");
CREATE UNIQUE INDEX "UserEntry_userId_mediaId_key" ON "UserEntry"("userId","mediaId");
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId","name");
CREATE INDEX "RouteProgress_userEntryId_sortOrder_idx" ON "RouteProgress"("userEntryId","sortOrder");
CREATE UNIQUE INDEX "RouteProgress_userEntryId_name_key" ON "RouteProgress"("userEntryId","name");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "ExternalMetadata" ADD CONSTRAINT "ExternalMetadata_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE;
ALTER TABLE "ExternalReference" ADD CONSTRAINT "ExternalReference_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE;
ALTER TABLE "UserEntry" ADD CONSTRAINT "UserEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "UserEntry" ADD CONSTRAINT "UserEntry_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "UserEntryTag" ADD CONSTRAINT "UserEntryTag_userEntryId_fkey" FOREIGN KEY ("userEntryId") REFERENCES "UserEntry"("id") ON DELETE CASCADE;
ALTER TABLE "UserEntryTag" ADD CONSTRAINT "UserEntryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE;
ALTER TABLE "RouteProgress" ADD CONSTRAINT "RouteProgress_userEntryId_fkey" FOREIGN KEY ("userEntryId") REFERENCES "UserEntry"("id") ON DELETE CASCADE;
