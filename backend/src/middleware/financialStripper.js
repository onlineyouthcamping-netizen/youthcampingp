/**
 * Financial Field Stripper Middleware for Guide Role
 */

const stripFinancialFieldsForGuides = (req, res, next) => {
  if (!req.user || req.user.role !== 'guide') {
    return next();
  }

  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object') {
      if (body.success && body.data !== undefined) {
        body.data = sanitize(body.data);
      } else {
        body = sanitize(body);
      }
    }
    return originalJson.call(this, body);
  };

  next();

  function sanitize(data) {
    if (data === null || data === undefined) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map(sanitize);
    }
    if (typeof data === 'object') {
      // If it's a Date object, return it directly
      if (data instanceof Date) {
        return data;
      }
      
      const keysToStrip = [
        'price',
        'stickyCardPrice',
        'stickyCardLabel',
        'baseAmount',
        'gstAmount',
        'totalAmount',
        'amount',
        'advancePaid',
        'remainingAmount',
        'paymentMode',
        'paymentStatus',
        'payment_status',
        'payment_method',
        'upiReference',
        'upi_reference',
        'invoiceStatus',
        'adjustedPrice'
      ];

      const clean = {};
      for (const [key, value] of Object.entries(data)) {
        if (keysToStrip.includes(key)) {
          // Strip/Exclude financial fields
          continue;
        }
        
        // Recursively sanitize nested objects/arrays (but don't recurse on buffers or specific classes)
        if (value && typeof value === 'object') {
          clean[key] = sanitize(value);
        } else {
          clean[key] = value;
        }
      }
      return clean;
    }
    return data;
  }
};

module.exports = {
  stripFinancialFieldsForGuides
};
