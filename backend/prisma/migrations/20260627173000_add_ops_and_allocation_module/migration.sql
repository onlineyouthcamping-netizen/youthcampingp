-- CreateEnum
CREATE TYPE "OpsVendorType" AS ENUM ('HOTEL', 'TRANSPORT', 'GUIDE', 'MEALS', 'MISC');

-- CreateEnum
CREATE TYPE "OpsBookingStatus" AS ENUM ('UNCONFIRMED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpsSOPStage" AS ENUM ('PRE_TRIP_30D', 'PRE_TRIP_7D', 'PRE_TRIP_1D', 'DEPARTURE_DAY', 'DURING_TRIP', 'POST_TRIP');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "OpsVendor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "type" "OpsVendorType" NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 5.0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsHotelBooking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "vendorId" TEXT,
    "hotelName" TEXT NOT NULL,
    "location" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "roomType" TEXT,
    "numberOfRooms" INTEGER NOT NULL DEFAULT 1,
    "confirmed" "OpsBookingStatus" NOT NULL DEFAULT 'UNCONFIRMED',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsHotelBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsTransportFleet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "vendorId" TEXT,
    "vehicleType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 13,
    "route" TEXT,
    "pickupPoints" TEXT,
    "dropPoints" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsTransportFleet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsGuidePayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "guideAdminId" TEXT,
    "vendorId" TEXT,
    "guideName" TEXT NOT NULL,
    "daysWorked" INTEGER NOT NULL DEFAULT 1,
    "agreedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsGuidePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsMiscExpense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsMiscExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsSeatConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "totalSeatsCap" INTEGER NOT NULL DEFAULT 30,
    "alertThreshold" INTEGER NOT NULL DEFAULT 25,
    "blockedSeats" INTEGER NOT NULL DEFAULT 0,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsSeatConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsSOPTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "destination" TEXT NOT NULL,
    "stage" "OpsSOPStage" NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsSOPTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsTripChecklist" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "stage" "OpsSOPStage" NOT NULL,
    "taskName" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "OpsTripChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsIncidentLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsIncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsAllocationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "resultJson" JSONB NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsAllocationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsAllocationOverride" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "allocationRunId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsAllocationOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsVehicleAllocation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "fleetId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "travelerName" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsVehicleAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsRoomAllocation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "genderGroup" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "travelerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsRoomAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsDayItinerary" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "date" TIMESTAMP(3),
    "dayTitle" TEXT NOT NULL,
    "paxCount" INTEGER NOT NULL DEFAULT 0,
    "hotelName" TEXT,
    "hotelVerified" BOOLEAN NOT NULL DEFAULT false,
    "vehicleType" TEXT,
    "vehicleVerified" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "guideDriverDetails" TEXT,
    "guideVerified" BOOLEAN NOT NULL DEFAULT false,
    "checkInDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsDayItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsTripExpense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "serviceDate" TIMESTAMP(3),
    "activity" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Due',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsTripExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpsVendor_tenantId_idx" ON "OpsVendor"("tenantId");
CREATE INDEX "OpsVendor_type_idx" ON "OpsVendor"("type");

CREATE INDEX "OpsHotelBooking_tenantId_idx" ON "OpsHotelBooking"("tenantId");
CREATE INDEX "OpsHotelBooking_tripId_departureDate_idx" ON "OpsHotelBooking"("tripId", "departureDate");

CREATE INDEX "OpsTransportFleet_tenantId_idx" ON "OpsTransportFleet"("tenantId");
CREATE INDEX "OpsTransportFleet_tripId_departureDate_idx" ON "OpsTransportFleet"("tripId", "departureDate");

CREATE INDEX "OpsGuidePayment_tenantId_idx" ON "OpsGuidePayment"("tenantId");
CREATE INDEX "OpsGuidePayment_tripId_departureDate_idx" ON "OpsGuidePayment"("tripId", "departureDate");

CREATE INDEX "OpsMiscExpense_tripId_departureDate_idx" ON "OpsMiscExpense"("tripId", "departureDate");

CREATE UNIQUE INDEX "OpsSeatConfig_tenantId_tripId_departureDate_key" ON "OpsSeatConfig"("tenantId", "tripId", "departureDate");

CREATE INDEX "OpsSOPTemplate_tenantId_destination_idx" ON "OpsSOPTemplate"("tenantId", "destination");

CREATE INDEX "OpsTripChecklist_tripId_departureDate_stage_idx" ON "OpsTripChecklist"("tripId", "departureDate", "stage");

CREATE INDEX "OpsIncidentLog_tripId_departureDate_idx" ON "OpsIncidentLog"("tripId", "departureDate");

CREATE INDEX "OpsAllocationRun_tenantId_tripId_departureDate_idx" ON "OpsAllocationRun"("tenantId", "tripId", "departureDate");

CREATE INDEX "OpsAllocationOverride_allocationRunId_idx" ON "OpsAllocationOverride"("allocationRunId");

CREATE INDEX "OpsVehicleAllocation_tripId_departureDate_idx" ON "OpsVehicleAllocation"("tripId", "departureDate");
CREATE INDEX "OpsVehicleAllocation_fleetId_idx" ON "OpsVehicleAllocation"("fleetId");
CREATE INDEX "OpsVehicleAllocation_bookingId_idx" ON "OpsVehicleAllocation"("bookingId");

CREATE INDEX "OpsRoomAllocation_tripId_departureDate_idx" ON "OpsRoomAllocation"("tripId", "departureDate");

CREATE INDEX "OpsDayItinerary_tripId_departureDate_idx" ON "OpsDayItinerary"("tripId", "departureDate");

CREATE INDEX "OpsTripExpense_tripId_departureDate_idx" ON "OpsTripExpense"("tripId", "departureDate");

-- AddForeignKey
ALTER TABLE "OpsHotelBooking" ADD CONSTRAINT "OpsHotelBooking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsHotelBooking" ADD CONSTRAINT "OpsHotelBooking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "OpsVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpsTransportFleet" ADD CONSTRAINT "OpsTransportFleet_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsTransportFleet" ADD CONSTRAINT "OpsTransportFleet_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "OpsVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpsGuidePayment" ADD CONSTRAINT "OpsGuidePayment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsGuidePayment" ADD CONSTRAINT "OpsGuidePayment_guideAdminId_fkey" FOREIGN KEY ("guideAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsGuidePayment" ADD CONSTRAINT "OpsGuidePayment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsGuidePayment" ADD CONSTRAINT "OpsGuidePayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "OpsVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpsMiscExpense" ADD CONSTRAINT "OpsMiscExpense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpsSeatConfig" ADD CONSTRAINT "OpsSeatConfig_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpsTripChecklist" ADD CONSTRAINT "OpsTripChecklist_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsTripChecklist" ADD CONSTRAINT "OpsTripChecklist_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpsIncidentLog" ADD CONSTRAINT "OpsIncidentLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsIncidentLog" ADD CONSTRAINT "OpsIncidentLog_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpsAllocationRun" ADD CONSTRAINT "OpsAllocationRun_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsAllocationRun" ADD CONSTRAINT "OpsAllocationRun_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpsAllocationOverride" ADD CONSTRAINT "OpsAllocationOverride_allocationRunId_fkey" FOREIGN KEY ("allocationRunId") REFERENCES "OpsAllocationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsAllocationOverride" ADD CONSTRAINT "OpsAllocationOverride_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpsVehicleAllocation" ADD CONSTRAINT "OpsVehicleAllocation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsVehicleAllocation" ADD CONSTRAINT "OpsVehicleAllocation_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "OpsTransportFleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsVehicleAllocation" ADD CONSTRAINT "OpsVehicleAllocation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpsRoomAllocation" ADD CONSTRAINT "OpsRoomAllocation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsRoomAllocation" ADD CONSTRAINT "OpsRoomAllocation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpsDayItinerary" ADD CONSTRAINT "OpsDayItinerary_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpsTripExpense" ADD CONSTRAINT "OpsTripExpense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
