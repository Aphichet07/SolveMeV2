import authService from "../services/auth.sevice.js";

const authController = {
  enterApp: async (req, res) => {
    try {
      console.log("🔥 /api/auth/enter called, body =", req.body);
      const { line_id, display_name, avatar_url, location } = req.body

      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }

      const user = await authService.upsertUserOnEnter({
        line_id,
        display_name,
        avatar_url,
        location
      });

      return res.json(user);
    } catch (err) {
      console.error("enterApp error:", err);
      return res
        .status(500)
        .json({ message: err.message || "enterApp ล้มเหลว" });
    }
  },
  // enterApp: async (req, res) => {
  //     try {
  //         const { line_id, display_name, avatar_url } = req.body || {};

  //         if (!line_id) {
  //             return res.status(400).json({ message: "line_id is required" });
  //         }

  //         const user = await authService.upsertUserOnEnter({
  //             line_id,
  //             display_name,
  //             avatar_url,
  //         });

  //         return res.json(user);
  //     } catch (err) {
  //         console.error("enterApp error:", err);
  //         return res.status(500).json({ message: "Internal server error" });
  //     }
  // },

  heartbeat: async (req, res) => {
    try {
      const { line_id } = req.body || {};
      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }
      await userService.updateHeartbeat(line_id);
      return res.json({ ok: true });
    } catch (err) {
      console.error("heartbeat error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  setReady: async (req, res) => {
    try {
      const { line_id, is_ready, location } = req.body || {};

      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }
      console.log("Location from Controller : ", location)
      const user = await authService.setUserReady({ line_id, is_ready, location });
      return res.json(user);
    } catch (err) {
      console.error("ready error:", err);
      return res
        .status(500)
        .json({ message: err.message || "ready failed" });
    }
  },
};

export default authController;
