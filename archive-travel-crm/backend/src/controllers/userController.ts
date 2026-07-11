import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Protected
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Try to fetch as User (Admin/Agent)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: 'admin',
          createdAt: user.createdAt
        }
      });
    }

    // Try to fetch as Traveler
    const traveler = await prisma.traveler.findUnique({ where: { id: userId } });
    if (traveler) {
      return res.json({
        success: true,
        data: {
          id: traveler.id,
          name: traveler.name,
          email: traveler.email,
          phone: traveler.phone,
          type: 'traveler',
          createdAt: traveler.createdAt
        }
      });
    }

    res.status(404).json({ success: false, message: 'User not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user's bookings
// @route   GET /api/users/bookings
// @access  Protected
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Try to get bookings for this user (could be traveler ID from JWT)
    const bookings = await prisma.booking.findMany({
      where: {
        travelerId: userId
      },
      include: {
        inquiry: {
          include: {
            trip: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings || []
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
};
