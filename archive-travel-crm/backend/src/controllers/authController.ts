import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '30d'
  });
};

// @desc    Login for Admin/Agent/Traveler
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, type } = req.body; // type: 'admin' or 'traveler'

    if (type === 'admin') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          success: true,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id)
          }
        });
      }
    } else {
      const traveler = await prisma.traveler.findUnique({ where: { email } });
      if (traveler && (await bcrypt.compare(password, traveler.password))) {
        return res.json({
          success: true,
          data: {
            id: traveler.id,
            name: traveler.name,
            email: traveler.email,
            token: generateToken(traveler.id)
          }
        });
      }
    }

    res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Register Traveler
// @route   POST /api/auth/register
// @access  Public
export const registerTraveler = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const traveler = await prisma.traveler.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: traveler.id,
        name: traveler.name,
        email: traveler.email,
        token: generateToken(traveler.id)
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc    Get current authenticated user (Admin or Traveler)
// @route   GET /api/auth/me
// @access  Protected
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Try to fetch as User (Admin)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: 'admin'
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
          type: 'traveler'
        }
      });
    }

    res.status(404).json({ success: false, message: 'User not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
