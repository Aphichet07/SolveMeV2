import { admin, db } from "../firebase/admin.js";
import userStatsService from "./userStats.service.js";

const USER_QUESTS_COLLECTION = "user_quests";
const FieldValue = admin.firestore.FieldValue;

const getTodayKey = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getDailyQuestTemplateForSolver = () => ([
  {
    id: "solve_1",
    title: "ช่วยเคสอย่างน้อย 1 ครั้งในวันนี้",
    type: "solve",
    target: 1,
    progress: 0,
    rewardScore: 10,
    completed: false,
    claimed: false,
  },
  {
    id: "solve_3",
    title: "ช่วยเคสอย่างน้อย 3 ครั้งในวันนี้",
    type: "solve",
    target: 3,
    progress: 0,
    rewardScore: 30,
    completed: false,
    claimed: false,
  },
]);

const dailyQuestService = {

  getOrCreateTodayQuests: async (lineId) => {
    const dateKey = getTodayKey();

    const snap = await db
      .collection(USER_QUESTS_COLLECTION)
      .where("line_id", "==", lineId)
      .where("dateKey", "==", dateKey)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    const quests = getDailyQuestTemplateForSolver();
    const now = FieldValue.serverTimestamp();

    const ref = await db.collection(USER_QUESTS_COLLECTION).add({
      line_id: lineId,
      dateKey,
      quests,
      created_at: now,
      updated_at: now,
    });

    return { id: ref.id, line_id: lineId, dateKey, quests };
  },

  getTodayQuestsForUser: async (lineId) => {
    return dailyQuestService.getOrCreateTodayQuests(lineId);
  },


  handleSolveEvent: async (lineId) => {
    const dateKey = getTodayKey();
    const col = db.collection(USER_QUESTS_COLLECTION);

    const rewardsToGive = await db.runTransaction(async (tx) => {
      const snap = await tx.get(
        col
          .where("line_id", "==", lineId)
          .where("dateKey", "==", dateKey)
          .limit(1)
      );

      let docRef;
      let data;

      if (snap.empty) {
        const quests = getDailyQuestTemplateForSolver();
        const now = FieldValue.serverTimestamp();
        docRef = col.doc();
        data = {
          line_id: lineId,
          dateKey,
          quests,
          created_at: now,
          updated_at: now,
        };
        tx.set(docRef, data);
      } else {
        docRef = snap.docs[0].ref;
        data = snap.docs[0].data();
      }

      const quests = data.quests || [];
      const rewards = [];

      const newQuests = quests.map((q) => {
        if (q.type !== "solve") return q;

        const newProgress = (q.progress || 0) + 1;
        let completed = q.completed || false;
        const claimed = q.claimed || false;

        if (!completed && newProgress >= q.target) {
          completed = true;
          rewards.push({
            questId: q.id,
            rewardScore: q.rewardScore || 0,
          });
        }

        return {
          ...q,
          progress: newProgress,
          completed,
          claimed,
        };
      });

      tx.update(docRef, {
        quests: newQuests,
        updated_at: FieldValue.serverTimestamp(),
      });

      return rewards;
    });

    if (Array.isArray(rewardsToGive) && rewardsToGive.length > 0) {
      const totalScore = rewardsToGive.reduce(
        (sum, r) => sum + (r.rewardScore || 0),
        0
      );

      if (totalScore > 0) {
        await userStatsService.addScore(lineId, totalScore);
        console.log(
          `[dailyQuest] lineId=${lineId} get quest reward score +${totalScore}`
        );
      }
    }
  },
};

export default dailyQuestService;
