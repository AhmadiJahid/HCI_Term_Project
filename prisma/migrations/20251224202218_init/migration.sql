-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "educationLevel" TEXT,
    "techAdaptation" INTEGER,
    "speakingAnx" INTEGER,
    "conditionOrder" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Trial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "trialIndex" INTEGER NOT NULL,
    "sudsPre" INTEGER,
    "sudsPost" INTEGER,
    "recordingDuration" REAL,
    "rerecordCount" INTEGER NOT NULL DEFAULT 0,
    "reviewTimeSec" REAL,
    "audioPlayed" BOOLEAN NOT NULL DEFAULT false,
    "textOnlyUsed" BOOLEAN NOT NULL DEFAULT false,
    "tabsVisited" TEXT NOT NULL DEFAULT '[]',
    "feltInControl" INTEGER,
    "helpful" INTEGER,
    "audioPath" TEXT,
    "transcript" TEXT,
    "coachStrength" TEXT,
    "coachTip" TEXT,
    "coachReframe" TEXT,
    "statsWordCount" INTEGER,
    "statsFillerCount" INTEGER,
    "statsWpm" REAL,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trial_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "trialId" TEXT,
    "eventName" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_participantId_key" ON "Participant"("participantId");

-- CreateIndex
CREATE INDEX "Trial_participantId_idx" ON "Trial"("participantId");

-- CreateIndex
CREATE INDEX "EventLog_participantId_idx" ON "EventLog"("participantId");

-- CreateIndex
CREATE INDEX "EventLog_trialId_idx" ON "EventLog"("trialId");
