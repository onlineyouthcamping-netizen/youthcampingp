const { z } = require("zod");
const { validate } = require("./index");

// ── WebsitePage schemas ─────────────────────────────────────────────
const createPageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug must be 255 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only",
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or fewer"),
  content: z.any().optional().default({}),
  metaTitle: z
    .string()
    .max(120, "Meta title must be 120 characters or fewer")
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(320, "Meta description must be 320 characters or fewer")
    .optional()
    .nullable(),
  ogImage: z
    .string()
    .url("OG image must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  published: z.boolean().optional().default(false),
});

const updatePageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only",
    )
    .optional(),
  title: z.string().min(1).max(255).optional(),
  content: z.any().optional(),
  metaTitle: z.string().max(120).optional().nullable(),
  metaDescription: z.string().max(320).optional().nullable(),
  ogImage: z.string().url().optional().nullable().or(z.literal("")),
  published: z.boolean().optional(),
});

// ── WebsiteSetting schemas ──────────────────────────────────────────
const upsertSettingSchema = z.object({
  value: z
    .any()
    .refine((val) => val !== undefined && val !== null, {
      message: "Setting value is required",
    }),
});

// ── PageBuilder section schemas ─────────────────────────────────────
const updateSectionSchema = z
  .object({
    content: z.any().optional(),
    draft: z.any().optional(),
    name: z.string().max(255).optional(),
    visible: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.content !== undefined ||
      data.draft !== undefined ||
      data.name !== undefined ||
      data.visible !== undefined,
    {
      message:
        "At least one field (content, draft, name, visible) must be provided",
    },
  );

const reorderSectionsSchema = z.object({
  orders: z
    .array(
      z.object({
        id: z.string().min(1, "Section ID is required"),
        order: z.number().int().min(0, "Order must be non-negative"),
      }),
    )
    .min(1, "At least one ordering entry is required"),
});

module.exports = {
  createPageSchema,
  updatePageSchema,
  upsertSettingSchema,
  updateSectionSchema,
  reorderSectionsSchema,
  validateCreatePage: validate(createPageSchema),
  validateUpdatePage: validate(updatePageSchema),
  validateUpsertSetting: validate(upsertSettingSchema),
  validateUpdateSection: validate(updateSectionSchema),
  validateReorderSections: validate(reorderSectionsSchema),
};
