import userStatsService from "./userStats.service.js";
import { db } from "../firebase/admin.js";

const chatService = {
  async completeChatAndUpdateStats({
    matchId,
    bubbleId,
    requesterId, 
    solverId,    
  }) {
    
    const tasks = [];

    if (requesterId) {
      tasks.push(userStatsService.addRequest(requesterId));
    }
    if (solverId) {
      tasks.push(userStatsService.addSolve(solverId));
    }

    await Promise.all(tasks);

 
    const matchRef = db.collection("matches").doc(matchId);
    await matchRef.set(
      {
        status: "COMPLETED",
        completed_at: FieldValue.serverTimestamp(),
        bubble_id: bubbleId || null,
      },
      { merge: true }
    );


    return true;
  },
};

export default chatService;
