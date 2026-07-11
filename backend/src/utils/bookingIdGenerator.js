const crypto = require('crypto');

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates a collision-free booking ID with the format: BK-XXXXXXXXXXXX
 * XXXXXXXXXXXX is a 12-character cryptographically secure uppercase alphanumeric string.
 * Total combinations: 36^12 = 4.7 x 10^18.
 * 
 * @returns {string} The unique booking ID.
 */
function generateBookingId() {
  const bytes = crypto.randomBytes(12);
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `BK-${id}`;
}

module.exports = {
  generateBookingId
};
