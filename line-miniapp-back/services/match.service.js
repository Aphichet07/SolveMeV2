import { db } from "../firebase/admin.js";
import { getDistanceMeters } from "../utils/distance.js";
import lineService from "./notify.service.js";
import userStatsService from "./userStats.service.js";
import dailyQuestService from "./quest.service.js";

const BUBBLE_COLLECTION = "bubbles";
const ROOM_COLLECTION = "rooms";
const USERS_COLLECTION = "users";
const DEFAULT_RADIUS_METERS = 20;

// ======================== Helpers ========================

async function getBubbleById(bubbleId) {
  if (!bubbleId) return null;
  const snap = await db.collection(BUBBLE_COLLECTION).doc(bubbleId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * ดึง user ที่:
 *  - status == "active"
 *  - is_ready == true
 *  - active == true
 *  - อยู่ในรัศมี radiusMeters จาก location ของ bubble
 *  - ไม่ใช่ requester เอง
 */
async function findCandidateSolversNearBubble(bubble, radiusMeters = DEFAULT_RADIUS_METERS) {
  if (!bubble.location?.lat || !bubble.location?.lon) {
    return [];
  }

  const { lat: bubbleLat, lon: bubbleLon } = bubble.location;
  const requesterId = bubble.requesterId;

  const userSnap = await db
    .collection(USERS_COLLECTION)
    .where("status", "==", "active")
    .where("is_ready", "==", true)
    .where("active", "==", true)
    .limit(200)
    .get();

  const candidates = [];

  userSnap.forEach((docSnap) => {
    const user = docSnap.data();
    const loc = user.location;

    if (!loc || typeof loc.lat !== "number" || typeof loc.lon !== "number") {
      return;
    }

    // กัน requester เอง
    if (user.line_id === requesterId) return;

    const dist = getDistanceMeters(bubbleLat, bubbleLon, loc.lat, loc.lon);
    if (dist > radiusMeters) return;

    candidates.push({
      id: docSnap.id,
      ...user,
      distanceMeters: dist,
    });
  });

  // ใกล้ก่อน
  candidates.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return candidates;
}

/**
 * สุ่ม solver 1 คนจาก candidates
 */
function pickRandomSolver(candidates) {
  if (!candidates.length) return null;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

async function createRoomForMatch({ bubble, solver }) {
  const docRef = await db.collection(ROOM_COLLECTION).add({
    bubbleId: bubble.id,
    requesterId: bubble.requesterId,
    solverId: solver.line_id,
    status: "pending", // pending | active | closed
    createdAt: new Date(),
    lastMessageAt: null,
  });

  return docRef.id;
}

async function updateBubbleMatched({ bubbleId, solver, roomId }) {
  await db.collection(BUBBLE_COLLECTION).doc(bubbleId).update({
    solverId: solver.line_id,
    matchId: roomId,
    status: "MATCHED",
    updatedAt: new Date(),
  });
}

// ======================== Service ========================

const matchService = {
  /**
   * wrapper ให้ตรงกับคอมเมนต์เก่า:
   * "พยายามหา solver สำหรับ bubble นี้"
   * ตอนนี้ให้ไปใช้ logic ของ assignSolverForBubble
   */
  async findOrCreateMatchForBubble(bubbleId, radiusMeters = DEFAULT_RADIUS_METERS) {
    return this.assignSolverForBubble(bubbleId, radiusMeters);
  },

  /**
   * ระบบเป็นคน assign solver ให้ bubble
   * - เลือกจาก active solvers รอบ bubble (ใน radiusMeters)
   * - กัน requester เองออก
   * - random 1 คน
   * - สร้าง room + update bubble
   * - อัปเดตสถิติ + quest + notify
   */
  async assignSolverForBubble(bubbleId, radiusMeters = DEFAULT_RADIUS_METERS) {
    const bubble = await getBubbleById(bubbleId);
    if (!bubble) {
      return { ok: false, reason: "BUBBLE_NOT_FOUND" };
    }

    if (!bubble.location?.lat || !bubble.location?.lon) {
      return { ok: false, reason: "BUBBLE_NO_LOCATION" };
    }

    // ถูก match ไปแล้ว
    if (bubble.status === "MATCHED" && bubble.solverId) {
      return {
        ok: true,
        reason: "ALREADY_MATCHED",
        data: {
          bubbleId: bubble.id,
          solverId: bubble.solverId,
          roomId: bubble.matchId ?? null,
        },
      };
    }

    const candidates = await findCandidateSolversNearBubble(bubble, radiusMeters);

    if (candidates.length === 0) {
      return { ok: false, reason: "NO_SOLVER_IN_RADIUS" };
    }

    const solver = pickRandomSolver(candidates);
    console.log("[matchService] picked solver:", solver.line_id);

    const roomId = await createRoomForMatch({ bubble, solver });
    await updateBubbleMatched({ bubbleId: bubble.id, solver, roomId });

    // สถิติ + quest
    try {
      await userStatsService.addSolve(solver.line_id);
    } catch (e) {
      console.warn("[matchService] addSolve error:", e);
    }

    try {
      await dailyQuestService.handleSolveEvent(solver.line_id);
    } catch (err) {
      console.warn("[matchService] handleSolveEvent error:", err);
    }

    // แจ้งเตือนผ่าน LINE
    await lineService.sendMatchNotificationToSolver({
      solverLineId: solver.line_id,
      roomId,
      bubble,
    });

    return {
      ok: true,
      reason: "MATCHED",
      data: {
        bubbleId: bubble.id,
        solverId: solver.line_id,
        roomId,
      },
    };
  },

  /**
   * ใช้ตอน solver “กดรับเคส” bubble นี้เอง
   * - ถ้า bubble ถูก match กับ solver คนเดิมอยู่แล้ว → ให้เข้า room เดิม
   * - ถ้า bubble ถูก match กับคนอื่นแล้ว → ALREADY_TAKEN
   * - ถ้ายังไม่ match → เช็ค solver คนนี้ว่า active+ready และอยู่ในรัศมี
   *   แล้วสร้าง room + update bubble + สถิติ + quest + notify
   */
  async solverAcceptForBubble(bubbleId, solverLineId, radiusMeters = DEFAULT_RADIUS_METERS) {
    if (!bubbleId || !solverLineId) {
      return { ok: false, reason: "MISSING_PARAM" };
    }

    const bubble = await getBubbleById(bubbleId);
    if (!bubble) {
      return { ok: false, reason: "BUBBLE_NOT_FOUND" };
    }

    const requesterId = bubble.requesterId;

    if (!bubble.location?.lat || !bubble.location?.lon) {
      return { ok: false, reason: "BUBBLE_NO_LOCATION" };
    }

    // กัน requester รับเคสตัวเอง
    if (requesterId === solverLineId) {
      return { ok: false, reason: "SOLVER_IS_REQUESTER" };
    }

    // ถ้า bubble ถูก match แล้ว
    if (bubble.status === "MATCHED" && bubble.solverId) {
      // ถ้าเป็น solver คนเดิม → ให้เข้า room เดิม
      if (bubble.solverId === solverLineId) {
        return {
          ok: true,
          reason: "ALREADY_MATCHED_THIS_SOLVER",
          data: {
            bubbleId: bubble.id,
            solverId: bubble.solverId,
            roomId: bubble.matchId ?? null,
          },
        };
      }

      // ถูกคนอื่นจองไปแล้ว
      return {
        ok: false,
        reason: "ALREADY_TAKEN_BY_OTHER_SOLVER",
        data: {
          bubbleId: bubble.id,
          solverId: bubble.solverId,
          roomId: bubble.matchId ?? null,
        },
      };
    }

    // ดึงข้อมูล solver
    const solverSnap = await db
      .collection(USERS_COLLECTION)
      .where("line_id", "==", solverLineId)
      .limit(1)
      .get();

    if (solverSnap.empty) {
      return { ok: false, reason: "SOLVER_NOT_FOUND" };
    }

    const solverDoc = solverSnap.docs[0];
    const solver = { id: solverDoc.id, ...solverDoc.data() };

    if (!solver.location?.lat || !solver.location?.lon) {
      return { ok: false, reason: "SOLVER_NO_LOCATION" };
    }

    // เช็ค active / ready
    if (solver.status !== "active" || !solver.is_ready || !solver.active) {
      return { ok: false, reason: "SOLVER_NOT_READY" };
    }

    // เช็คระยะ
    const dist = getDistanceMeters(
      bubble.location.lat,
      bubble.location.lon,
      solver.location.lat,
      solver.location.lon
    );

    if (dist > radiusMeters) {
      return { ok: false, reason: "SOLVER_OUT_OF_RADIUS", distanceMeters: dist };
    }

    // สร้าง room + update bubble
    const roomId = await createRoomForMatch({ bubble, solver });
    await updateBubbleMatched({ bubbleId: bubble.id, solver, roomId });

    // สถิติ + quest
    try {
      await userStatsService.addSolve(solver.line_id);
    } catch (e) {
      console.warn("[matchService] addSolve error:", e);
    }

    try {
      await dailyQuestService.handleSolveEvent(solver.line_id);
    } catch (err) {
      console.warn("[matchService] handleSolveEvent error:", err);
    }

    // แจ้งเตือน solver (อาจจะไม่จำเป็นก็ได้ เพราะเป็นเคส solver กดเอง)
    try {
      await lineService.sendMatchNotificationToSolver({
        solverLineId: solver.line_id,
        roomId,
        bubble,
      });
    } catch (err) {
      console.warn("[matchService] sendMatchNotificationToSolver error:", err);
    }

    return {
      ok: true,
      reason: "MATCHED",
      data: {
        bubbleId: bubble.id,
        solverId: solver.line_id,
        roomId,
      },
    };
  },
};

export default matchService;


// import { db } from "../firebase/admin.js";
// import { getDistanceMeters } from "../utils/distance.js";
// import lineService from "./notify.service.js";
// import userStatsService from "./userStats.service.js";
// import dailyQuestService from "./quest.service.js";

// const matchService = {
//   /**
//    * พยายามหา solver สำหรับ bubble นี้
//    * - ถ้ามี match อยู่แล้ว → คืน match เดิม
//    * - ถ้ายังไม่มี → หา user active แล้วสร้าง match ใหม่
//    */
//   async findOrCreateMatchForBubble(bubbleId) {
//     const bubbleRef = db.collection("bubbles").doc(bubbleId);
//     const bubbleSnap = await bubbleRef.get();

//     if (!bubbleSnap.exists) {
//       throw new Error("bubble not found");
//     }

//     const bubbleData = bubbleSnap.data();
//     const requesterId = bubbleData.requesterId;

//     // ถ้า bubble นี้ถูก match ไปแล้ว
//     if (bubbleData.matchId && bubbleData.solverId) {
//       const matchRef = db.collection("matches").doc(bubbleData.matchId);
//       const matchSnap = await matchRef.get();
//       const matchData = matchSnap.exists ? matchSnap.data() : null;

//   return candidates;
// }

// /**
//  * สุ่ม solver 1 คนจาก candidates
//  */
// function pickRandomSolver(candidates) {
//   if (!candidates.length) return null;
//   const idx = Math.floor(Math.random() * candidates.length);
//   return candidates[idx];
// }

// async function createRoomForMatch({ bubble, solver }) {
//   const docRef = await db.collection(ROOM_COLLECTION).add({
//     bubbleId: bubble.id,
//     requesterId: bubble.requesterId,
//     solverId: solver.line_id,
//     status: "pending",
//     createdAt: new Date(),
//     lastMessageAt: null,
//   });

//   return docRef.id;
// }

// async function updateBubbleMatched({ bubbleId, solver, roomId }) {
//   await db.collection(BUBBLE_COLLECTION).doc(bubbleId).update({
//     solverId: solver.line_id,
//     matchId: roomId,
//     status: "MATCHED",
//     updatedAt: new Date(),
//   });
// }


// async function assignSolverForBubble(bubbleId) {
//   const bubble = await getBubbleById(bubbleId);
//   if (!bubble) {
//     return { ok: false, reason: "BUBBLE_NOT_FOUND" };
//   }

//   if (!bubble.location?.lat || !bubble.location?.lon) {
//     return { ok: false, reason: "BUBBLE_NO_LOCATION" };
//   }

//   // ถูก match ไปแล้ว
//   if (bubble.status === "MATCHED" && bubble.solverId) {
//     return {
//       ok: true,
//       reason: "ALREADY_MATCHED",
//       data: {
//         bubbleId: bubble.id,
//         solverId: bubble.solverId,
//         roomId: bubble.matchId ?? null,
//       },
//     };
//   }

//   const allCandidates = await findCandidateSolversNearBubble(bubble);
  
//   const candidates = allCandidates.filter(
//   (solver) => solver.line_id !== bubble.requesterId
// );

//   if (candidates.length === 0) {
//     return { ok: false, reason: "NO_SOLVER_IN_RADIUS" };
//   }

//   const solver = pickRandomSolver(candidates);
//   console.log("LINNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN: ", solver.line_id)
//   const roomId = await createRoomForMatch({ bubble, solver });

//   await updateBubbleMatched({ bubbleId: bubble.id, solver, roomId });

//   try {
//     await userStatsService.addSolve(solver.line_id);
//   } catch (e) {
//     console.warn("[matchService] addSolve error:", e);
//   }

//   try {
//     await dailyQuestService.handleSolveEvent(solver.line_id);
//   } catch (err) {
//     console.warn("[matchService] handleSolveEvent error:", err);
//   }

//   await lineService.sendMatchNotificationToSolver({
//     solverLineId: solver.line_id,
//     roomId,
//     bubble,
//   });

//   return {
//     ok: true,
//     reason: "MATCHED",
//     data: {
//       bubbleId: bubble.id,
//       solverId: solver.line_id,
//       roomId,
//     },
//   };
// }
// async function solverAcceptForBubble(bubbleId, solverLineId) {
//   if (!bubbleId || !solverLineId) {
//     return { ok: false, reason: "MISSING_PARAM" };
//   }

//   const bubbleRef = db.collection(BUBBLE_COLLECTION).doc(bubbleId);
//   const bubbleSnap = await bubbleRef.get();

//   if (!bubbleSnap.exists) {
//     return { ok: false, reason: "BUBBLE_NOT_FOUND" };
//   }

//   const bubbleData = bubbleSnap.data();
//   const requesterId = bubbleData.requesterId;

//   // ถ้าถูก match ไปแล้ว
//   if (bubbleData.status === "MATCHED" && bubbleData.matchId) {
//     // ถ้าเป็น solver คนเดิม → ให้เข้า room เดิม
//     if (bubbleData.solverId === solverLineId) {
//       return {
//         status: "MATCHED",
//         requesterId,
//         solverId: bubbleData.solverId,
//         match: matchData,
//       };
//     }

//     // ดึง user ที่ active อยู่
//     let usersQuery = db
//       .collection("users")
//       .where("status", "==", "active")
//       .where("active", "==", true)
//       .limit(50);

//     const usersSnap = await usersQuery.get();

//     const candidates = [];
//     usersSnap.forEach((docSnap) => {
//       const user = docSnap.data();

//       // กันไม่ให้ requester match กับตัวเอง
//       if (user.line_id === requesterId) return;

//       candidates.push({
//         id: docSnap.id,
//         ...user,
//       });
//     });

//     if (candidates.length === 0) {
//       // ยังไม่พบ solver ที่พร้อม
//       return {
//         status: "SEARCHING",
//         requesterId,
//         solverId: null,
//         match: null,
//       };
//     }

//     // เลือก solver สักคน (ตอนนี้ random ง่าย ๆ ก่อน)
//     const idx = Math.floor(Math.random() * candidates.length);
//     const solver = candidates[idx];

//     // สร้าง match document
//     const now = admin.firestore.FieldValue.serverTimestamp();
//     const matchDoc = {
//       bubbleId,
//       requesterId,
//       solverId: solver.line_id || solver.id,
//       status: "ACTIVE", // ACTIVE | COMPLETED | CANCELLED
//       createdAt: now,
//       updatedAt: now,
//     };

//     const matchRef = await db.collection("matches").add(matchDoc);

//     // อัปเดต bubble ให้รู้ว่า match แล้ว
//     await bubbleRef.update({
//       status: "MATCHED",
//       matchId: matchRef.id,
//       solverId: matchDoc.solverId,
//       updatedAt: now,
//     });

//     return {
//       status: "MATCHED",
//       requesterId,
//       solverId: matchDoc.solverId,
//       match: {
//         id: matchRef.id,
//         ...matchDoc,
//       },
//       solver, // เผื่อ front อยากโชว์ชื่อ/รูป solver
//     };
//   }
// };
  
// export default matchService;
