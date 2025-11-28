// controllers/match.controller.js
import matchService from "../services/match.service.js";


const matchController = {

  findSolver: async (req, res) => {
    try {
      const { bubbleId } = req.body || {};

      if (!bubbleId) {
        return res.status(400).json({ message: "bubbleId is required" });
      }

      const result = await matchService.assignSolverForBubble(bubbleId);

      if (!result.ok) {
        if (result.reason === "BUBBLE_NOT_FOUND") {
          return res.status(404).json({ message: "Bubble not found" });
        }
        if (result.reason === "NO_SOLVER_IN_RADIUS") {
          return res.status(200).json({
            status: "NO_SOLVER",
            message: "ยังไม่มี solver ที่พร้อมในรัศมีตอนนี้",
          });
        }
        if (result.reason === "BUBBLE_NO_LOCATION") {
          return res.status(400).json({
            status: "NO_LOCATION",
            message: "Bubble ไม่มี location สำหรับใช้หา solver",
          });
        }
        
        return res.status(200).json({
          status: result.reason,
          message: result.reason,
        });
      }

      const { data, reason } = result;
      console.log("RoomId From findSolver : ", data.roomId)
      return res.json({
        status: reason,
        bubbleId: data.bubbleId,
        solverId: data.solverId,
        roomId: data.roomId,
      });
    } catch (err) {
      console.error("Error in matchController.findSolver:", err);
      return res
        .status(500)
        .json({ message: "Internal server error", error: err.message });
    }
  },

  solverAccept: async (req, res) => {
    try {
      const { bubbleId, solverLineId } = req.body || {};

      if (!bubbleId || !solverLineId) {
        return res.status(400).json({
          status: "MISSING_PARAM",
          message: "bubbleId และ solverLineId จำเป็นต้องมี",
        });
      }

      const result = await matchService.solverAcceptForBubble(
        bubbleId,
        solverLineId
      );

      if (!result.ok) {
        switch (result.reason) {
          case "BUBBLE_NOT_FOUND":
            return res.status(404).json({
              status: "BUBBLE_NOT_FOUND",
              message: "ไม่พบ bubble นี้",
            });
          case "ALREADY_TAKEN":
            return res.status(409).json({
              status: "ALREADY_TAKEN",
              message: "bubble นี้ถูก solver คนอื่นรับไปแล้ว",
            });
          case "MISSING_PARAM":
            return res.status(400).json({
              status: "MISSING_PARAM",
              message: "bubbleId และ solverLineId จำเป็นต้องมี",
            });
          default:
            return res.status(500).json({
              status: "ERROR",
              message: "ไม่สามารถสร้างห้องแชทได้",
            });
        }
      }

      const { data, reason } = result;

      return res.json({
        status: reason, // "MATCHED" | "ALREADY_MATCHED"
        roomId: data.roomId,
        bubble: data.bubble,
      });
    } catch (err) {
      console.error("Error in matchController.solverAccept:", err);
      return res
        .status(500)
        .json({ status: "ERROR", message: "Internal server error" });
    }
  },
};

export default matchController;



// // controllers/bubbleController.js
// import matchService from "../services/match.service.js";
// // import bubbleService ... (ตัวอื่นๆ ของคุณ)

// const matchController = {
//   // ... CreateBubble ฯลฯ

//   MatchStatus: async (req, res) => {
//     try {
//       const { bubbleId } = req.params;

//       const result = await matchService.findOrCreateMatchForBubble(bubbleId);
//       // result = { status, requesterId, solverId, match, solver? }

//       // map ให้ตรงกับที่ WaitingForSolverPage คาดหวัง
//       if (result.status === "MATCHED") {
//         return res.json({
//           status: "MATCHED",
//           requesterId: result.requesterId,
//           solverId: result.solverId,
//           solver: result.solver
//             ? {
//                 id: result.solver.line_id || result.solver.id,
//                 name: result.solver.display_name || "Solver",
//                 avatar_url: result.solver.avatar_url || null,
//               }
//             : null,
//         });
//       }

//       // ยังหาไม่ได้ → ให้ status เป็น SEARCHING
//       if (result.status === "SEARCHING") {
//         return res.json({
//           status: "SEARCHING",
//           requesterId: result.requesterId,
//           solverId: null,
//           solver: null,
//         });
//       }

//       // เผื่ออนาคตอยากใส่ TIMEOUT logic
//       return res.json({
//         status: result.status || "SEARCHING",
//         requesterId: result.requesterId,
//         solverId: result.solverId || null,
//         solver: null,
//       });
//     } catch (err) {
//       console.error("MatchStatus error:", err);
//       return res.status(500).json({
//         status: "ERROR",
//         message: "Internal server error",
//       });
//     }
//   },
// };

// export default bubbleController;
