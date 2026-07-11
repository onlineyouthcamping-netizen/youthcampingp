import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: typeof usersTable.$inferSelect;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    let userId: number;

    const JWT_SECRET = process.env.JWT_SECRET || "4f9e8d7c6b5a4132211009988776655443322110";
    const isLocalDev = 
      process.env.NODE_ENV !== "production" || 
      process.env.MAIN_BACKEND_URL?.includes("localhost") || 
      process.env.DATABASE_URL?.includes("localhost") || 
      process.env.DATABASE_URL?.includes("127.0.0.1");

    if (token === "1" && isLocalDev) {
      userId = 1;
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch (err) {
        res.status(401).json({ error: "Invalid or expired authorization token" });
        return;
      }
    }

    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user && userId === 1 && isLocalDev) {
      // Fallback for local testing (Bearer 1): map to the first admin user in the database
      const [fallbackAdmin] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "admin"))
        .limit(1);
      if (fallbackAdmin) {
        user = fallbackAdmin;
      }
    }

    if (!user) {
      res.status(401).json({ error: "User not found for this token" });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

