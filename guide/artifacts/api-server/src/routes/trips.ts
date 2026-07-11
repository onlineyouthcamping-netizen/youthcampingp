import { Router, Request, Response, NextFunction } from "express";
import { db, tripsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Middleware to ensure the authenticated user is a guide
function requireGuide(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "guide") {
    res.status(403).json({ error: "Access denied. Guides only." });
    return;
  }
  next();
}

router.get("/trips/active", requireAuth, requireGuide, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [activeTrip] = await db
      .select()
      .from(tripsTable)
      .where(
        and(
          eq(tripsTable.leadGuideId, user.id),
          eq(tripsTable.status, "active")
        )
      )
      .limit(1);

    if (!activeTrip) {
      res.status(204).send();
      return;
    }

    res.json({
      id: activeTrip.id,
      name: activeTrip.name,
      location: activeTrip.location,
      startDate: activeTrip.startDate.toISOString(),
      endDate: activeTrip.endDate.toISOString(),
      leadGuideId: activeTrip.leadGuideId,
      status: activeTrip.status,
      createdAt: activeTrip.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
