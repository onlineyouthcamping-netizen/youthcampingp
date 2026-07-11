import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

      // Check User (Admin/Agent)
      let user = await prisma.user.findUnique({ 
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true }
      });

      // If not User, check Traveler
      if (!user) {
        const traveler = await prisma.traveler.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, email: true }
        });
        if (traveler) {
          user = { ...traveler, role: 'TRAVELER' } as any;
        }
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  }
};
