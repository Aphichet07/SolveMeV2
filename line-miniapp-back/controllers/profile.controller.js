import profileService from "../services/profile.service.js";

const profileController = {
  updateCarryProfile: async (req, res) => {
    try {
      console.log("🔥 /api/profile/carry called, body =", req.body);
      const { line_id, carry_profile } = req.body || {};

      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }

      if (!carry_profile || typeof carry_profile !== "object") {
        return res
          .status(400)
          .json({ message: "carry_profile must be a non-empty object" });
      }

      const updatedUser = await profileService.updateCarryProfile({
        line_id,
        carry_profile,
      });

      return res.json(updatedUser);
    } catch (err) {
      console.error("updateCarryProfile error:", err);
      return res
        .status(500)
        .json({ message: err.message || "อัปเดต carry_profile ล้มเหลว" });
    }
  },
};

export default profileController;
