const { body, validationResult } = require("express-validator");

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
  }
  next();
};

exports.validateSop = [
  body("tripId").notEmpty().withMessage("tripId is required"),
  body("title").notEmpty().withMessage("title is required"),
  body("description").notEmpty().withMessage("description is required"),
  body("category").notEmpty().withMessage("category is required"),
  body("items").isArray().optional().withMessage("items must be an array"),
  body("items.*.title").notEmpty().withMessage("item title is required"),
  body("items.*.content").notEmpty().withMessage("item content is required"),
  this.validateRequest,
];

exports.validateTicketingSop = [
  body("tripId").notEmpty().withMessage("tripId is required"),
  body("title").notEmpty().withMessage("title is required"),
  body("category").notEmpty().withMessage("category is required"),
  body("items").isArray().optional().withMessage("items must be an array"),
  this.validateRequest,
];

exports.validateTicketingLink = [
  body("tripId").notEmpty().withMessage("tripId is required"),
  body("label").notEmpty().withMessage("label is required"),
  body("val").notEmpty().withMessage("val is required"),
  body("icon").notEmpty().withMessage("icon is required"),
  body("linkUrl")
    .isURL({ require_protocol: true, protocols: ["https"] })
    .withMessage("linkUrl must be a valid https URL"),
  this.validateRequest,
];

exports.validateItinerary = [
  body("tripId").notEmpty().withMessage("tripId is required"),
  body("name").notEmpty().withMessage("name is required"),
  body("days").isArray().withMessage("days must be an array"),
  this.validateRequest,
];
