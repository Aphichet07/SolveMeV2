import authService from "../services/auth.sevice.js";
// import userService from "../services/user.service.js";

const authController = {
  /**
   * POST /api/auth/enter
   */
  async enterApp(req, res) {
    try {
      console.log("🔥 [authController.enterApp] body =", req.body);

      const { line_id, display_name, avatar_url, location } = req.body || {};

      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }

      const user = await authService.upsertUserOnEnter({
        line_id,
        display_name,
        avatar_url,
        location,
      });

      return res.json(user);
    } catch (err) {
      console.error("[authController.enterApp] error:", err);
      return res
        .status(500)
        .json({ message: err.message || "enterApp ล้มเหลว" });
    }
  },

  /**
   * POST /api/auth/heartbeat
   */
  async heartbeat(req, res) {
    try {
      const { line_id } = req.body || {};
      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }

      await authService.updateHeartbeat(line_id);
      return res.json({ ok: true });
    } catch (err) {
      console.error("heartbeat error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   * POST /api/auth/ready
   **/
  async setReady(req, res) {
    try {
      const { line_id, is_ready, location } = req.body || {};

      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }

      console.log("[authController.setReady] location =", location);

      const user = await authService.setUserReady({
        line_id,
        is_ready,
        location,
      });

      return res.json(user);
    } catch (err) {
      console.error("[authController.setReady] error:", err);
      return res.status(500).json({ message: err.message || "ready failed" });
    }
  },
};

export default authController;

// import authService from "../services/auth.sevice.js";

// const authController = {
//   enterApp: async (req, res) => {
//     try {
//       console.log("🔥 /api/auth/enter called, body =", req.body);
//       const { line_id, display_name, avatar_url, location } = req.body

//       if (!line_id) {
//         return res.status(400).json({ message: "line_id is required" });
//       }

//       const user = await authService.upsertUserOnEnter({
//         line_id,
//         display_name,
//         avatar_url,
//         location
//       });

//       return res.json(user);
//     } catch (err) {
//       console.error("enterApp error:", err);
//       return res
//         .status(500)
//         .json({ message: err.message || "enterApp ล้มเหลว" });
//     }
//   },

//   heartbeat: async (req, res) => {
//     try {
//       const { line_id } = req.body || {};
//       if (!line_id) {
//         return res.status(400).json({ message: "line_id is required" });
//       }
//       await userService.updateHeartbeat(line_id);
//       return res.json({ ok: true });
//     } catch (err) {
//       console.error("heartbeat error:", err);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   },
//   setReady: async (req, res) => {
//     try {
//       const { line_id, is_ready, location } = req.body || {};

//       if (!line_id) {
//         return res.status(400).json({ message: "line_id is required" });
//       }
//       console.log("Location from Controller : ", location)
//       const user = await authService.setUserReady({ line_id, is_ready, location });
//       return res.json(user);
//     } catch (err) {
//       console.error("ready error:", err);
//       return res
//         .status(500)
//         .json({ message: err.message || "ready failed" });
//     }
//   },
// };

// export default authController;
