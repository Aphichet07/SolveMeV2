import chatService from "../services/chat.service.js";

const chatController = {
  completeChat: async (req, res) => {
    try {
      const {
        match_id,
        bubble_id,
        requester_id,  
        solver_id,     
      } = req.body;

      if (!match_id || !requester_id || !solver_id) {
        return res.status(400).json({ message: "missing required fields" });
      }

      await chatService.completeChatAndUpdateStats({
        matchId: match_id,
        bubbleId: bubble_id,
        requesterId: requester_id,
        solverId: solver_id,
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("completeChat error:", err);
      return res.status(500).json({ message: "internal error" });
    }
  },
};

export default chatController;
