import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "4f9e8d7c6b5a4132211009988776655443322110";

router.post("/auth/login", async (req, res) => {
  try {
    const { phone, role } = req.body;
    if (!phone || !role) {
      res.status(400).json({ error: "Phone and role are required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, phone))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.role !== role) {
      res.status(401).json({ error: "Unauthorized role mismatch" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      dailyRate: user.dailyRate,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
