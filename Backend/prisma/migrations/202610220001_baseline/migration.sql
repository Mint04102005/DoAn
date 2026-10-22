-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'SALON_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalonStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "gender" TEXT,
    "dob" TEXT,
    "address" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salons" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "operatingHours" TEXT,
    "images" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "status" "SalonStatus" NOT NULL DEFAULT 'PENDING',
    "tag" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hairstyles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gender" TEXT NOT NULL,
    "faceShapes" TEXT[],
    "hairType" TEXT,
    "imageUrl" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hairstyles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_shapes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_shapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hair_faces" (
    "id" SERIAL NOT NULL,
    "hairstyleId" INTEGER NOT NULL,
    "faceShapeId" INTEGER NOT NULL,
    "suitabilityScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "hair_faces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "salonId" INTEGER NOT NULL,
    "bookingTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "try_on_histories" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "hairstyleId" INTEGER,
    "originalImageUrl" TEXT NOT NULL,
    "resultImageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "try_on_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "faceShapeDetected" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "recommendedHairstyleIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "salons_ownerId_idx" ON "salons"("ownerId");

-- CreateIndex
CREATE INDEX "salons_status_idx" ON "salons"("status");

-- CreateIndex
CREATE UNIQUE INDEX "face_shapes_name_key" ON "face_shapes"("name");

-- CreateIndex
CREATE INDEX "hair_faces_hairstyleId_idx" ON "hair_faces"("hairstyleId");

-- CreateIndex
CREATE INDEX "hair_faces_faceShapeId_idx" ON "hair_faces"("faceShapeId");

-- CreateIndex
CREATE UNIQUE INDEX "hair_faces_hairstyleId_faceShapeId_key" ON "hair_faces"("hairstyleId", "faceShapeId");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_salonId_idx" ON "bookings"("salonId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "try_on_histories_userId_idx" ON "try_on_histories"("userId");

-- CreateIndex
CREATE INDEX "recommendation_logs_userId_idx" ON "recommendation_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- AddForeignKey
ALTER TABLE "salons" ADD CONSTRAINT "salons_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_faces" ADD CONSTRAINT "hair_faces_hairstyleId_fkey" FOREIGN KEY ("hairstyleId") REFERENCES "hairstyles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_faces" ADD CONSTRAINT "hair_faces_faceShapeId_fkey" FOREIGN KEY ("faceShapeId") REFERENCES "face_shapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_histories" ADD CONSTRAINT "try_on_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_histories" ADD CONSTRAINT "try_on_histories_hairstyleId_fkey" FOREIGN KEY ("hairstyleId") REFERENCES "hairstyles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_logs" ADD CONSTRAINT "recommendation_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
