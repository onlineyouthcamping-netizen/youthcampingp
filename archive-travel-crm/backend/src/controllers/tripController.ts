import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

// @desc    Get all trips
// @route   GET /api/trips
// @access  Public
export const getTrips = async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get single trip by slug
// @route   GET /api/trips/:slug
// @access  Public
export const getTripBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { slug: slug as string }
    });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Create new trip
// @route   POST /api/admin/trips
// @access  Private (Admin/Agent)
export const createTrip = async (req: Request, res: Response) => {
  try {
    const { title, description, price, duration, location, images, inclusions, exclusions, itinerary } = req.body;
    
    const slug = slugify(title, { lower: true, strict: true });

    const trip = await prisma.trip.create({
      data: {
        title,
        slug,
        description,
        price,
        duration,
        location,
        images,
        inclusions,
        exclusions,
        itinerary
      }
    });

    res.status(201).json({ success: true, data: trip });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Trip with this title already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get trip by ID
// @route   GET /api/trips/:id
// @access  Public
export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: id as string }
    });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private (Admin only)
export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, price, duration, location, images, inclusions, exclusions, itinerary } = req.body;

    const trip = await prisma.trip.update({
      where: { id: id as string },
      data: {
        ...(title && { title, slug: slugify(title, { lower: true, strict: true }) }),
        description,
        price,
        duration,
        location,
        images,
        inclusions,
        exclusions,
        itinerary
      }
    });

    res.json({ success: true, data: trip });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private (Admin only)
export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.trip.delete({
      where: { id: id as string }
    });

    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};
