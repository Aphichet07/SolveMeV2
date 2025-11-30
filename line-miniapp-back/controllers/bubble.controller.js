import bubbleService from "../services/bubble.sevice.js";
import callService from "../services/callai.service.js";
import matchService from "../services/match.service.js";

const bubbleController = {
  /* GET /api/bubbles/list*/
  async GetBubbles(req, res) {
    try {
      const userId = req.query.userId || null;
      const location = null; // ตอนนี้ยังไม่ได้ใช้ แต่เผื่ออนาคต

      console.log("[bubbleController.GetBubbles] userId =", userId);

      const bubbles = await bubbleService.getBubbles(userId, location);
      return res.json(bubbles);
    } catch (err) {
      console.error("[bubbleController.GetBubbles] error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  /* POST /api/bubbles/create*/
  /* สร้าง bubble ใหม่ + ให้ AI ช่วยจัด priority*/
  async CreateBubble(req, res) {
    try {
      const { title, description, expiresInMinutes, userId, location ,category: rawCategory,} =
        req.body || {};

      console.log("[bubbleController.CreateBubble] body =", req.body);

      if (!title || !description || !expiresInMinutes || !userId) {
        return res.status(400).json({
          message: "title, description, expiresInMinutes, userId จำเป็นต้องมี",
        });
      }

      let setpriority = "MEDIUM";

      try {
        const { priority } = await callService.getPriority(description);
        setpriority = priority;
      } catch (err) {
        console.error(
          "[bubbleController.CreateBubble] AI priority failed, fallback MEDIUM:",
          err.message
        );
      }
      let category = (rawCategory || "").toString().toUpperCase();

      const ALLOWED_CATEGORIES = [
        "EMERGENCY",
        "HEALTH",
        "TECH",
        "DAILY",
        "DIRECTION",
        "OTHER",
      ];

      if (!ALLOWED_CATEGORIES.includes(category)) {
        // ถ้าไม่ส่งมา หรือส่งมั่ว → ให้ AI เดาหมวดจาก description
        try {
          const { category: aiCat } = await callService.getCategory(
            description
          );
          const upper = (aiCat || "").toString().toUpperCase();
          category = ALLOWED_CATEGORIES.includes(upper) ? upper : "OTHER";
        } catch (err) {
          console.error("AI category failed, fallback OTHER:", err.message);
          category = "OTHER";
        }
      }

      const bubble = await bubbleService.createBubble(
        title,
        description,
        expiresInMinutes,
        userId,
        location,
        setpriority,
        category
      );

      return res.status(200).json(bubble);
    } catch (err) {
      console.error("[bubbleController.CreateBubble] error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  /* GET /api/bubbles/nearby*/
  async Nearby(req, res) {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      const radius =
        req.query.radiusMeters !== undefined
          ? parseFloat(req.query.radiusMeters)
          : 70;

      console.log(
        "[bubbleController.Nearby] lat, lon, radius =",
        lat,
        lon,
        radius
      );

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ message: "lat และ lon ต้องเป็นตัวเลข" });
      }

      const items = await bubbleService.getNearbyBubbles(lat, lon, radius);
      return res.json(items);
    } catch (err) {
      console.error("[bubbleController.Nearby] error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  /* (STUB) DELETE /api/bubbles/delete*/

  async deleteBubble(req, res) {
    try {
      const bubbleId = req.body?.bubbleId;

      if (!bubbleId) {
        return res.status(500).json({ message: "Kuy" });
      }

      await bubbleService.deleteBubble(bubbleId);

      return res.status(200).json({ message: "Deleted" });
    } catch (err) {
      console.error("[bubbleController.deleteBubble] error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  /* (STUB) POST /api/bubbles/edit*/

  async editBubble(req, res) {
    try {
      const { bubbleid, title, dest } = req.body || {};

      if (!bubbleid || !title || !dest) {
        return res.status(500).json({ message: "Kuy" });
      }
      return res.status(200).json({ messsage: "Edit success", bubble: null });
    } catch (err) {
      console.error("[bubbleController.editBubble] error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  /* GET /api/bubbles/:bubbleId/match-status (แบบใช้ matchService)*/

  async MatchStatus(req, res) {
    try {
      const { bubbleId } = req.params;
      const result = await matchService.findOrCreateMatchForBubble(bubbleId);
      // result = { status, requesterId, solverId, match, solver? }

      if (result.status === "MATCHED") {
        return res.json({
          status: "MATCHED",
          requesterId: result.requesterId,
          solverId: result.solverId,
          solver: result.solver
            ? {
                id: result.solver.line_id || result.solver.id,
                name: result.solver.display_name || "Solver",
                avatar_url: result.solver.avatar_url || null,
              }
            : null,
        });
      }

      if (result.status === "SEARCHING") {
        return res.json({
          status: "SEARCHING",
          requesterId: result.requesterId,
          solverId: null,
          solver: null,
        });
      }

      return res.json({
        status: result.status || "SEARCHING",
        requesterId: result.requesterId,
        solverId: result.solverId || null,
        solver: null,
      });
    } catch (err) {
      console.error("[bubbleController.MatchStatus] error:", err);
      return res.status(500).json({
        status: "ERROR",
        message: "Internal server error",
      });
    }
  },

  /* GET /api/bubbles/:bubbleId/match-status (แบบใช้ bubbleService)*/
  async getMatchStatus(req, res) {
    try {
      const { bubbleId } = req.params;

      const result = await bubbleService.getMatchStatus(bubbleId);

      if (!result.ok) {
        if (result.reason === "NOT_FOUND") {
          return res
            .status(404)
            .json({ status: "ERROR", message: "Bubble not found" });
        }
        return res
          .status(200)
          .json({ status: "ERROR", message: "Unknown error" });
      }

      return res.json(result.data);
    } catch (err) {
      console.error("[bubbleController.getMatchStatus] error:", err);
      return res
        .status(500)
        .json({ status: "ERROR", message: "Internal server error" });
    }
  },

  /* GET /api/bubbles/solvers/active?bubbleId=...*/

  async getActiveSolvers(req, res) {
    try {
      const { bubbleId } = req.query;

      const solvers = await bubbleService.getActiveSolversAroundBubble(
        bubbleId
      );

      return res.json(solvers);
    } catch (err) {
      console.error("[bubbleController.getActiveSolvers] error:", err);
      return res.status(500).json({ message: "Internal error" });
    }
  },
};

export default bubbleController;
