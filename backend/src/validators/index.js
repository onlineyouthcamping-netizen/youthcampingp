const { z } = require("zod");

// ── Reusable Zod middleware factory ──────────────────────────────────
/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * On failure, passes a ZodError to next() so errorHandler.js returns structured errors.
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err); // ZodError is caught by errorHandler.js
  }
};

// ── Booking schemas ─────────────────────────────────────────────────
const createBookingSchema = z
  .object({
    tripId: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    fullName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    mobile: z.string().optional().nullable(),
    email: z
      .string()
      .email("Valid email is required")
      .optional()
      .nullable()
      .or(z.literal("")),
    amount: z
      .number({ coerce: true })
      .min(0, "Amount must be non-negative")
      .optional()
      .nullable(),
    totalAmount: z
      .number({ coerce: true })
      .min(0, "Amount must be non-negative")
      .optional()
      .nullable(),
    advancePaid: z.number({ coerce: true }).min(0).optional().nullable(),
    numberOfTravelers: z
      .number({ coerce: true })
      .int()
      .min(1)
      .optional()
      .nullable(),
    departureDate: z.string().optional().nullable(),
    pickupCity: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    passengers: z.any().optional().nullable(),
    // Add all other fields to prevent them from being stripped by the Zod validate middleware
    tripName: z.string().optional().nullable(),
    sourceBookingLinkId: z.string().optional().nullable(),
    sourceBookingLinkToken: z.string().optional().nullable(),
    sourceBookingLinkPayload: z.string().optional().nullable(),
    sourceBookingLinkSignature: z.string().optional().nullable(),
    skipDays: z.number({ coerce: true }).optional().nullable(),
    adjustedPrice: z.number({ coerce: true }).optional().nullable(),
    baseAmount: z.number({ coerce: true }).optional().nullable(),
    remainingAmount: z.number({ coerce: true }).optional().nullable(),
    status: z.string().optional().nullable(),
    paymentStatus: z.string().optional().nullable(),
    paymentMode: z.string().optional().nullable(),
    trainClass: z.string().optional().nullable(),
    roomType: z.string().optional().nullable(),
    ticketStatus: z.string().optional().nullable(),
    basePrice: z.number({ coerce: true }).optional().nullable(),
    gstAmount: z.number({ coerce: true }).optional().nullable(),
    age: z
      .number({ coerce: true })
      .int("Age must be an integer")
      .min(1, "Age must be at least 1")
      .max(120, "Age must be at most 120")
      .optional()
      .nullable(),
    gender: z.string().optional().nullable(),
    bookingId: z.string().optional().nullable(),
    salesAdminId: z.string().optional().nullable(),
  })
  .refine((data) => data.name || data.fullName, {
    message: "Either name or fullName must be provided",
    path: ["name"],
  })
  .refine((data) => data.phone || data.mobile, {
    message: "Either phone or mobile must be provided",
    path: ["phone"],
  })
  .refine(
    (data) => {
      if (!data.passengers) return true;
      const list = Array.isArray(data.passengers)
        ? data.passengers
        : Array.isArray(data.passengers?.persons)
          ? data.passengers.persons
          : [];
      for (const p of list) {
        if (p && p.age !== undefined && p.age !== null && p.age !== "") {
          const num = Number(p.age);
          if (isNaN(num) || num < 1 || num > 120) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: "Passenger age must be a valid number between 1 and 120",
      path: ["passengers"],
    },
  );

// ── Inquiry schemas ─────────────────────────────────────────────────
const createInquirySchema = z.object({
  phone: z.string().min(5, "Phone is required"),
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  message: z.string().optional().nullable(),
  tripId: z.string().optional().nullable(),
  tripTitle: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  count: z.number({ coerce: true }).int().min(1).optional().nullable(),
  source: z.string().optional().nullable(),
});

// ── Blog schemas ────────────────────────────────────────────────────
const createBlogSchema = z.object({
  title: z.string().min(1, "Blog title is required"),
  slug: z.string().min(1, "Blog slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  type: z.enum(["blog", "reel"]).optional(),
});

// ── Admin login schema ──────────────────────────────────────────────
const adminLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

module.exports = {
  validate,
  createBookingSchema,
  createInquirySchema,
  createBlogSchema,
  adminLoginSchema,
};
