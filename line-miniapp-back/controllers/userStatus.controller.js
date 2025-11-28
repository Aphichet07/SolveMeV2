import userStatusService from "../services/userStatus.service.js";

export async function pingUserStatus(req, res, next) {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await userStatusService.pingUser(userId);

    return res.json({
      ok: true,
      userId: result.userId,
      lastActiveAt: result.lastActiveAt,
    });
  } catch (err) {
    console.error("[pingUserStatus] error:", err);
    next(err);
  }
}

/**
 * GET /api/users/:userId/status
 */
export async function getUserStatus(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await userStatusService.getUserWithOnlineStatus(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      userId: user.id,
      isOnlineComputed: user.computedOnline,
      lastActiveAt: user.lastActiveAt || null,
    });
  } catch (err) {
    console.error("[getUserStatus] error:", err);
    next(err);
  }
}
