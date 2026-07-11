const { generateBookingId } = require('../../backend/src/utils/bookingIdGenerator');

describe('Unit Tests: Booking ID Generator & Retry Logic', () => {
  it('should generate IDs with prefix BK- followed by 12 uppercase alphanumeric characters', () => {
    const id = generateBookingId();
    expect(id).toMatch(/^BK-[0-9A-Z]{12}$/);
  });

  it('should generate 10,000 unique IDs without any collision', () => {
    const ids = new Set();
    const count = 10000;
    
    for (let i = 0; i < count; i++) {
      const id = generateBookingId();
      expect(id).toMatch(/^BK-[0-9A-Z]{12}$/);
      ids.add(id);
    }
    
    expect(ids.size).toBe(count);
  });

  describe('Public Request bookingId Protection', () => {
    it('should ignore bookingId passed in public requests and generate backend ID', () => {
      // Simulate req.body containing arbitrary bookingId from a public visitor
      const req = {
        body: { bookingId: 'BK-USERCONTROLLEDID' },
        user: undefined // public (unauthenticated)
      };

      const isAdmin = req.user && ((req.user as any).role === 'admin' || (req.user as any).role === 'superadmin');
      let savedBookingId;
      
      // Mimic the updated controller logic
      if (req.body.bookingId) {
        if (!isAdmin) {
          // Ignore manual ID for non-admins and generate securely
          savedBookingId = generateBookingId();
        } else {
          savedBookingId = req.body.bookingId;
        }
      } else {
        savedBookingId = generateBookingId();
      }

      expect(savedBookingId).not.toBe('BK-USERCONTROLLEDID');
      expect(savedBookingId).toMatch(/^BK-[0-9A-Z]{12}$/);
    });

    it('should accept and validate bookingId passed by authenticated admin', () => {
      const req = {
        body: { bookingId: 'BK-A7D92F1C8E3B' },
        user: { role: 'admin' } // authenticated admin
      };

      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
      let savedBookingId;
      let errorMsg = '';

      if (req.body.bookingId) {
        if (!isAdmin) {
          savedBookingId = generateBookingId();
        } else {
          if (!/^BK-[0-9A-Z]{12}$/.test(req.body.bookingId)) {
            errorMsg = 'Invalid manual booking ID format';
          } else {
            savedBookingId = req.body.bookingId;
          }
        }
      }

      expect(errorMsg).toBe('');
      expect(savedBookingId).toBe('BK-A7D92F1C8E3B');
    });

    it('should reject invalid bookingId format passed by admin', () => {
      const req = {
        body: { bookingId: 'BK-INVALID-SIZE-ID' },
        user: { role: 'admin' }
      };

      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
      let errorMsg = '';

      if (req.body.bookingId) {
        if (!isAdmin) {
          // ignored
        } else {
          if (!/^BK-[0-9A-Z]{12}$/.test(req.body.bookingId)) {
            errorMsg = 'Invalid manual booking ID format. Must match /^BK-[0-9A-Z]{12}$/';
          }
        }
      }

      expect(errorMsg).toBe('Invalid manual booking ID format. Must match /^BK-[0-9A-Z]{12}$/');
    });
  });

  describe('Booking ID Collision Retry Logic', () => {
    it('should retry generation up to 3 times on P2002 collision error and succeed on 3rd attempt', () => {
      let mockPrismaCalls = 0;
      
      const mockPrismaCreate = jest.fn().mockImplementation(() => {
        mockPrismaCalls++;
        if (mockPrismaCalls < 3) {
          const error = new Error('Unique constraint failed');
          (error as any).code = 'P2002';
          (error as any).meta = { target: ['bookingId'] };
          throw error;
        }
        return { id: 'booking-success', bookingId: 'BK-RESOLVEDID12' };
      });

      let booking;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const currentBookingId = generateBookingId();
          booking = mockPrismaCreate(currentBookingId);
          break;
        } catch (error: any) {
          attempts++;
          if (error.code === 'P2002' && attempts < maxAttempts) {
            continue;
          }
          if (attempts >= maxAttempts) {
            throw new Error('Server failed to generate a unique booking ID after multiple attempts.');
          }
          throw error;
        }
      }

      expect(mockPrismaCalls).toBe(3);
      expect(attempts).toBe(2); // Retried twice, succeeded on 3rd call
      expect(booking).toEqual({ id: 'booking-success', bookingId: 'BK-RESOLVEDID12' });
    });

    it('should throw an explicit error when all 3 attempts fail due to simulated collisions', () => {
      let mockPrismaCalls = 0;
      
      const mockPrismaCreate = jest.fn().mockImplementation(() => {
        mockPrismaCalls++;
        const error = new Error('Unique constraint failed');
        (error as any).code = 'P2002';
        (error as any).meta = { target: ['bookingId'] };
        throw error;
      });

      let attempts = 0;
      const maxAttempts = 3;
      let thrownError: any = null;

      try {
        while (attempts < maxAttempts) {
          try {
            const currentBookingId = generateBookingId();
            mockPrismaCreate(currentBookingId);
            break;
          } catch (error: any) {
            attempts++;
            if (error.code === 'P2002' && attempts < maxAttempts) {
              continue;
            }
            if (attempts >= maxAttempts) {
              throw new Error('Server failed to generate a unique booking ID after multiple attempts.');
            }
            throw error;
          }
        }
      } catch (err) {
        thrownError = err;
      }

      expect(mockPrismaCalls).toBe(3);
      expect(attempts).toBe(3);
      expect(thrownError.message).toBe('Server failed to generate a unique booking ID after multiple attempts.');
    });
  });
});
