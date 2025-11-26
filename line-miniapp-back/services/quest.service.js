import { admin, db } from "../firebase/admin.js";
import userStatsService from "./userStats.service.js";

const USER_QUESTS_COLLECTION = "user_quests";
const FieldValue = admin.firestore.FieldValue;

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * template ของ daily quest สำหรับ solver ใน 1 วัน
 * อยากเพิ่ม/แก้อะไร ก็แก้ตรงนี้อย่างเดียว
 */
function getDailyQuestTemplateForSolver() {
  return [
    {
      id: "solve_1",
      title: "ช่วยเคสอย่างน้อย 1 ครั้งในวันนี้",
      type: "solve",      // ประเภท quest
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
  ];
}

/**
 * คืน doc user_quests ของวันนี้ (สร้างถ้าไม่มี)
 */
async function getOrCreateTodayQuests(lineId) {
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

  // ถ้ายังไม่มี → สร้างใหม่ด้วย template
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
}

/**
 * ให้ frontend เรียก GET /api/quests/daily → ใช้ฟังก์ชันนี้
 */
async function getTodayQuestsForUser(lineId) {
  return getOrCreateTodayQuests(lineId);
}

/**
 * เวลาที่ solver "ช่วยสำเร็จ 1 เคส" → เรียกอันนี้
 * จะ auto + progress ให้ทุก quest ที่ type === "solve"
 * และถ้า progress >= target && !completed → mark completed
 * และเพิ่มคะแนนทันที
 */
async function handleSolveEvent(lineId) {
  const dateKey = getTodayKey();
  const col = db.collection(USER_QUESTS_COLLECTION);

  // ใช้ transaction หรือ get + update ก็ได้
  await db.runTransaction(async (tx) => {
    const snap = await tx
      .get(
        col
          .where("line_id", "==", lineId)
          .where("dateKey", "==", dateKey)
          .limit(1)
      );

    let docRef;
    let data;

    if (snap.empty) {
      // ยังไม่มี quest วันนี้ → สร้างจาก template
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
    let updated = false;
    const rewardsToGive = []; // { questId, rewardScore }

    const newQuests = quests.map((q) => {
      if (q.type !== "solve") return q;

      // เพิ่ม progress ทีละ 1
      const newProgress = (q.progress || 0) + 1;
      let completed = q.completed || false;
      let claimed = q.claimed || false;

      if (!completed && newProgress >= q.target) {
        completed = true;
        // auto ให้ reward เลย (ไม่ต้อง claim) ถ้าคุณอยากให้ต้องกด claim ก็ไม่ต้อง push
        rewardsToGive.push({
          questId: q.id,
          rewardScore: q.rewardScore || 0,
        });
      }

      updated = true;

      return {
        ...q,
        progress: newProgress,
        completed,
        claimed, // ตอนนี้ auto-claim เลยภายหลัง
      };
    });

    if (updated) {
      tx.update(docRef, {
        quests: newQuests,
        updated_at: FieldValue.serverTimestamp(),
      });

      // หลังจาก transaction จบค่อย addScore
      // (ทำภายนอก transaction ดีกว่า แต่เราจะ return rewardsToGive ออกไปด้านนอกแทนได้)
    }

    // เก็บ rewardsToGive ใน doc meta ให้ return ออกไป (ผ่าน value return ของ transaction)
    return rewardsToGive;
  }).then(async (rewardsToGive) => {
    // ให้คะแนนหลังจาก transaction สำเร็จแล้ว
    if (Array.isArray(rewardsToGive) && rewardsToGive.length > 0) {
      let totalScore = 0;
      for (const r of rewardsToGive) {
        totalScore += r.rewardScore || 0;
      }
      if (totalScore > 0) {
        await userStatsService.addScore(lineId, totalScore);
        console.log(
          `[dailyQuest] lineId=${lineId} get quest reward score +${totalScore}`
        );
      }
    }
  });
}



const dailyQuestService = {
  getTodayQuestsForUser,
  handleSolveEvent,
}

export default dailyQuestService