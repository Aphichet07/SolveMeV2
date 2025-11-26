// controllers/bubbleController.js
import matchService from "../services/match.service.js";
// import bubbleService ... (ตัวอื่นๆ ของคุณ)

const matchController = {
  // ... CreateBubble ฯลฯ

  MatchStatus: async (req, res) => {
    try {
      const { bubbleId } = req.params;

      const result = await matchService.findOrCreateMatchForBubble(bubbleId);
      // result = { status, requesterId, solverId, match, solver? }

      // map ให้ตรงกับที่ WaitingForSolverPage คาดหวัง
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

      // ยังหาไม่ได้ → ให้ status เป็น SEARCHING
      if (result.status === "SEARCHING") {
        return res.json({
          status: "SEARCHING",
          requesterId: result.requesterId,
          solverId: null,
          solver: null,
        });
      }

      // เผื่ออนาคตอยากใส่ TIMEOUT logic
      return res.json({
        status: result.status || "SEARCHING",
        requesterId: result.requesterId,
        solverId: result.solverId || null,
        solver: null,
      });
    } catch (err) {
      console.error("MatchStatus error:", err);
      return res.status(500).json({
        status: "ERROR",
        message: "Internal server error",
      });
    }
  },
};

export default bubbleController;
