// controllers/solverWait.controller.js
import solverWaitService from "../services/solverWait.service.js";

const solverWaitController = {
  /**
   * POST /api/solver/wait
   * body: { line_id: string, wait: boolean, location?: {lat, lon} }
   */
  toggleWait: async (req, res) => {
    try {
      const { line_id, wait, location } = req.body || {};

      if (!line_id) {
        return res.status(400).json({ message: "line_id is required" });
      }

      if (typeof wait !== "boolean") {
        return res
          .status(400)
          .json({ message: "wait must be boolean (true/false)" });
      }

      const updatedUser = await solverWaitService.setWaitMode({
        lineId: line_id,
        wait,
        location,
      });

      return res.json({
        ok: true,
        wait_mode: updatedUser.wait_mode,
        is_ready: updatedUser.is_ready,
        active: updatedUser.active,
      });
    } catch (err) {
      console.error("toggleWait error:", err);
      return res
        .status(500)
        .json({ message: err.message || "toggleWait failed" });
    }
  },
};

export default solverWaitController;
