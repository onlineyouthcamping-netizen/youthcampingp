import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Submit new inquiry
// @route   POST /api/inquiries
// @access  Public
export const submitInquiry = async (req: Request, res: Response) => {
  try {
    const { tripId, name, phone, email, travelDate, pax, source } = req.body;

    const inquiry = await prisma.inquiry.create({
      data: {
        tripId,
        name,
        phone,
        email,
        travelDate: new Date(travelDate),
        pax,
        source: source || 'website',
        status: 'NEW'
      },
      include: {
        trip: {
          select: { title: true }
        }
      }
    });

    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get all inquiries
// @route   GET /api/admin/inquiries
// @access  Private
export const getInquiries = async (req: Request, res: Response) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      include: {
        trip: { select: { title: true, price: true, location: true } },
        admin: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Update inquiry status/notes
// @route   PATCH /api/admin/inquiries/:id
// @access  Private
export const updateInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;

    const inquiry = await prisma.inquiry.update({
      where: { id: id as string },
      data: {
        status,
        notes,
        assignedTo
      }
    });

    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get traveler's own inquiries
// @route   GET /api/inquiries/me
// @access  Private
export const getMyInquiries = async (req: any, res: Response) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: { email: req.user.email },
      include: {
        trip: { select: { title: true, images: true, location: true, duration: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};
