import profileService from "../services/profile.service.js";

const profileController = {
  /**
   * @desc    Updates the 'carry_profile' for a user identified by line_id.
   * @route   POST /api/profile/carry
   * @access  Private
   */
  updateCarryProfile: async (req, res) => {
    try {
      // 1. Logging the request
      console.log("🔥 /api/profile/carry called, body =", req.body);

      const { line_id, carry_profile } = req.body || {};

      // 2. Input Validation (line_id)
      if (!line_id) {
        return res.status(400).json({
          message: "line_id is required",
        });
      }

      // 3. Input Validation (carry_profile)
      if (
        !carry_profile ||
        typeof carry_profile !== "object" ||
        Object.keys(carry_profile).length === 0
      ) {
        return res.status(400).json({
          message: "carry_profile must be a non-empty object",
        });
      }

      // 4. Service Interaction
      const updatedUser = await profileService.updateCarryProfile({
        line_id,
        carry_profile,
      });

      // 5. Successful Response
      return res.json(updatedUser);
    } catch (err) {
      // 6. Error Handling
      console.error("updateCarryProfile error:", err);

      return res.status(500).json({
        message: err.message || "อัปเดต carry_profile ล้มเหลว", // Default message in Thai
      });
    }
  },
  
  async getStats(req, res) {
    try {
      const lineId = req.query.line_id || req.body?.line_id;

      if (!lineId) {
        return res.status(400).json({ message: "line_id is required" });
      }

      const stats = await profileService.getStatsByLineId(lineId);

      if (!stats) {
        return res.status(404).json({ message: "user not found" });
      }

      return res.json(stats);
    } catch (err) {
      console.error("[profileStatsController] getStats error:", err);
      return res
        .status(500)
        .json({ message: err.message || "โหลดข้อมูลสถิล้มเหลว" });
    }
  },
};

export default profileController;

// import profileService from "../services/profile.service.js";

// const profileController = {
//   updateCarryProfile: async (req, res) => {
//     try {
//       console.log("🔥 /api/profile/carry called, body =", req.body);
//       const { line_id, carry_profile } = req.body || {};

//       if (!line_id) {
//         return res.status(400).json({ message: "line_id is required" });
//       }

//       if (!carry_profile || typeof carry_profile !== "object") {
//         return res
//           .status(400)
//           .json({ message: "carry_profile must be a non-empty object" });
//       }

//       const updatedUser = await profileService.updateCarryProfile({
//         line_id,
//         carry_profile,
//       });

//       return res.json(updatedUser);
//     } catch (err) {
//       console.error("updateCarryProfile error:", err);
//       return res
//         .status(500)
//         .json({ message: err.message || "อัปเดต carry_profile ล้มเหลว" });
//     }
//   },
// };

// export default profileController;
