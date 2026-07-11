import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // Get counts
    const [tripsCount, inquiriesCount, bookingsCount, travelersCount, usersCount] = await Promise.all([
      prisma.trip.count(),
      prisma.inquiry.count(),
      prisma.booking.count(),
      prisma.traveler.count(),
      prisma.user.count()
    ]);

    // Get revenue total from bookings with PAID status
    const revenueResult = await prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'PAID' }
    });
    const revenueTotal = revenueResult._sum.totalAmount || 0;

    // Get recent inquiries
    const recentInquiries = await prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        pax: true,
        createdAt: true,
        trip: { select: { title: true } }
      }
    });

    // Get trips with highest inquiries
    const topTrips = await prisma.trip.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        _count: {
          select: { inquiries: true }
        }
      },
      orderBy: {
        inquiries: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Booking status breakdown
    const bookingStatusBreakdown = await prisma.booking.groupBy({
      by: ['paymentStatus'],
      _count: true
    });

    // Inquiry status breakdown
    const inquiryStatusBreakdown = await prisma.inquiry.groupBy({
      by: ['status'],
      _count: true
    });

    res.json({
      success: true,
      data: {
        overview: {
          trips: tripsCount,
          inquiries: inquiriesCount,
          bookings: bookingsCount,
          travelers: travelersCount,
          users: usersCount,
          revenue: revenueTotal
        },
        recentInquiries,
        topTrips: topTrips.map(trip => ({
          ...trip,
          inquiriesCount: trip._count.inquiries
        })),
        bookingStatusBreakdown: Object.fromEntries(
          bookingStatusBreakdown.map(item => [item.paymentStatus, item._count])
        ),
        inquiryStatusBreakdown: Object.fromEntries(
          inquiryStatusBreakdown.map(item => [item.status, item._count])
        )
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
