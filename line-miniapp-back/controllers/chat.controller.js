import chatService from "../services/chat.service.js";
import { admin, db } from "../firebase/admin.js";


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

  /**
   * POST /api/chat/exit
   */
  exitChat: async (req, res) => {
    try {
      const { match_id, user_id, role } = req.body || {};

      if (!match_id || !user_id) {
        return res
          .status(400)
          .json({ message: "match_id และ user_id จำเป็นต้องมี" });
      }

      const roomRef = db.collection("rooms").doc(match_id);
      const snap = await roomRef.get();

      if (!snap.exists) {
        return res.status(404).json({ message: "Room not found" });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();

      const update = {
        updated_at: now,
        status: "CLOSED",
        closed_at: now,
        closed_by: user_id,
        closed_by_role: role || null,
      };

      await roomRef.update(update);

      const messagesColRef = roomRef.collection("messages");
      await messagesColRef.add({
        type: "SYSTEM",
        kind: "ROOM_CLOSED",
        message: "ห้องนี้ถูกปิดโดยผู้ใช้",
        closed_by: user_id,
        closed_by_role: role || null,
        created_at: now,
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error("exitChat error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default chatController;
