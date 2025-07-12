-- CreateTable
CREATE TABLE "note_threads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "drawingData" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shareUrl" TEXT NOT NULL,
    CONSTRAINT "responses_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "note_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "responses_shareUrl_key" ON "responses"("shareUrl");
