// PUBLIC: Lookup booking by user-facing bookingId (e.g. BK-087017) — for confirmation page
exports.getBookingPublic = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    let isAuthorized = false;

    // Check admin auth from Authorization header
    if (req.headers.authorization) {
      try {
        const authHeader = req.headers.authorization || '';
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice('Bearer '.length).trim();
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const admin = await prisma.admin.findUnique({
            where: { id: decoded.id }
          });
          if (admin && admin.isActive) {
            isAuthorized = true;
          }
        }
      } catch (err) {
        // Ignore auth error, proceed to cookie check
      }
    }

    // Check confirm_token cookie
    if (!isAuthorized) {
      const cookies = parseCookies(req);
      const token = cookies[`confirm_token_${bookingId}`];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.bookingId === bookingId) {
            isAuthorized = true;
          }
        } catch (err) {
          // Token expired or invalid
        }
      }
    }

    // Fetch booking
    let booking = await prisma.booking.findFirst({
      where: { bookingId: String(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!isAuthorized) {
      return res.status(401).json({ success: false, message: 'Unauthorized access to booking details' });
    }

    // Map co-travelers to safe list (only name, gender, age)
    let persons = [];
    if (booking.passengers && typeof booking.passengers === 'object') {
      const rawPersons = Array.isArray(booking.passengers) ? booking.passengers : (booking.passengers.persons || []);
      persons = rawPersons.map(p => ({
        name: p.name,
        gender: p.gender,
        age: p.age ? Number(p.age) : null
      }));
    }

    // Return strictly whitelisted fields required by confirmation page
    const publicData = {
      id: booking.id,
      bookingId: booking.bookingId,
      tripName: booking.tripName,
      tripId: booking.tripId,
      status: booking.status,
      name: booking.name,
      gender: booking.gender,
      age: booking.age,
      departureDate: booking.departureDate,
      pickupCity: booking.pickupCity,
      passengers: persons
    };

    res.json({ success: true, data: publicData });
  } catch (error) {
    next(error);
  }
};
