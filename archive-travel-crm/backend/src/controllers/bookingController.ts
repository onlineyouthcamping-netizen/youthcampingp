import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Convert inquiry to booking
// @route   POST /api/admin/bookings
// @access  Private
export const createBookingFromInquiry = async (req: Request, res: Response) => {
  try {
    const { inquiryId, totalAmount, travelers, paymentStatus } = req.body;

    // Fetch inquiry to get customer email
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { trip: true }
    });

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // Check if booking already exists for this inquiry
    const existingBooking = await prisma.booking.findUnique({
      where: { inquiryId }
    });

    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'Booking already exists for this inquiry' });
    }

    // Optional: Auto-link to Traveler if account exists
    const traveler = await prisma.traveler.findUnique({
      where: { email: inquiry.email }
    });

    // Use transaction to create booking and update inquiry status
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          inquiryId,
          totalAmount: totalAmount || (inquiry.trip.price * inquiry.pax),
          travelers: travelers || [{ name: inquiry.name, email: inquiry.email, phone: inquiry.phone }],
          travelerId: traveler?.id,
          paymentStatus: paymentStatus || 'PENDING'
        }
      });

      await tx.inquiry.update({
        where: { id: inquiryId },
        data: { status: 'BOOKED' }
      });

      return booking;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private
export const getBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        inquiry: {
          include: {
            trip: { select: { title: true } }
          }
        },
        traveler: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get traveler's own bookings
// @route   GET /api/bookings/me
// @access  Private
export const getMyBookings = async (req: any, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { travelerId: req.user.id },
      include: {
        inquiry: {
          include: {
            trip: { select: { title: true, images: true, location: true, duration: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
      include: {
        inquiry: {
          include: {
            trip: true
          }
        },
        traveler: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin)
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { totalAmount, paymentStatus, travelers } = req.body;

    const booking = await prisma.booking.update({
      where: { id: id as string },
      data: {
        ...(totalAmount && { totalAmount }),
        ...(paymentStatus && { paymentStatus }),
        ...(travelers && { travelers })
      },
      include: {
        inquiry: { include: { trip: true } }
      }
    });

    res.json({ success: true, data: booking });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin)
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First, update the associated inquiry status back to NEGOTIATING
    const booking = await prisma.booking.findUnique({ where: { id: id as string } });
    if (booking) {
      await prisma.inquiry.update({
        where: { id: booking.inquiryId },
        data: { status: 'NEGOTIATING' }
      });
    }

    await prisma.booking.delete({
      where: { id: id as string }
    });

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};
