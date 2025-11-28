// controllers/dailyQuest.controller.js
import dailyQuestService from "../services/quest.service.js";

const dailyQuestController = {
  /**
   * GET /api/quests/daily?lineId=xxxx
   */
  getDailyQuests: async (req, res) => {
    try {
      const { lineId } = req.query || {};
      if (!lineId) {
        return res.status(400).json({ message: "lineId is required" });
      }

      const data = await dailyQuestService.getTodayQuestsForUser(lineId);
      return res.json(data);
    } catch (err) {
      console.error("getDailyQuests error:", err);
      return res
        .status(500)
        .json({ message: "Internal server error", error: err.message });
    }
  },
};

export default dailyQuestController;
