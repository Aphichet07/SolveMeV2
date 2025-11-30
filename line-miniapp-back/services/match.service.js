import { db } from "../firebase/admin.js";
import { getDistanceMeters } from "../utils/distance.js";
import lineService from "./notify.service.js";
import userStatsService from "./userStats.service.js";
import dailyQuestService from "./quest.service.js";

const BUBBLE_COLLECTION = "bubbles";
const USER_COLLECTION = "users";
const ROOM_COLLECTION = "rooms";

const VISIBLE_RADIUS_METERS = 70;

async function getBubbleById(bubbleId) {
  const snap = await db.collection(BUBBLE_COLLECTION).doc(bubbleId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function findCandidateSolversNearBubble(bubble) {
  if (
    !bubble?.location ||
    typeof bubble.location.lat !== "number" ||
    typeof bubble.location.lon !== "number"
  ) {
    console.warn("[findCandidateSolversNearBubble] bubble has no location");
    return [];
  }

  const usersRef = db.collection(USER_COLLECTION);

  // เอาเฉพาะ user ที่
  // - active == true
  // - is_ready == true
  // - wait_mode == true  (เปิดโหมดรอเคสอัตโนมัติ)
  const snapshot = await usersRef
    .where("active", "==", true)
    .where("is_ready", "==", true)
    .where("wait_mode", "==", true)
    .get();

  const candidates = [];

  console.log("[findCandidateSolversNearBubble] total users =", snapshot.size);

  snapshot.forEach((doc) => {
    const u = doc.data();

    // ใช้ last_location เป็นหลัก ถ้าไม่มีค่อย fallback ไป location
    const userLat = u.last_location?.lat ?? u.location?.lat;
    const userLon = u.last_location?.lon ?? u.location?.lon;

    if (typeof userLat !== "number" || typeof userLon !== "number") {
      console.log(
        "[findCandidateSolversNearBubble] skip user",
        doc.id,
        "no location"
      );
      return;
    }

    const dist = getDistanceMeters(
      bubble.location.lat,
      bubble.location.lon,
      userLat,
      userLon
    );

    console.log(
      "[findCandidateSolversNearBubble] user",
      doc.id,
      "dist =",
      dist
    );

    if (dist <= VISIBLE_RADIUS_METERS) {
      candidates.push({
        id: doc.id,
        ...u,
        distanceMeters: dist,
      });
    }
  });

  console.log(
    "[findCandidateSolversNearBubble] candidates in radius =",
    candidates.length
  );

  return candidates;
}

// async function findCandidateSolversNearBubble(bubble) {
//   const usersRef = db.collection(USER_COLLECTION);

//   // 1) query ให้ตรงกับ schema จริง
//   const snapshot = await usersRef
//     .where("active", "==", true)
//     .where("is_ready", "==", true)
//     .get();

//   const candidates = [];

//   console.log("[findCandidateSolversNearBubble] total users =", snapshot.size);

//   snapshot.forEach((doc) => {
//     const u = doc.data();

//     // 2) ใช้ last_location แทน location
//     const userLat = u.last_location?.lat ?? u.location?.lat;
//     const userLon = u.last_location?.lon ?? u.location?.lon;

//     if (typeof userLat !== "number" || typeof userLon !== "number") {
//       console.log(
//         "[findCandidateSolversNearBubble] skip user",
//         doc.id,
//         "no location"
//       );
//       return;
//     }

//     const dist = getDistanceMeters(
//       bubble.location.lat,
//       bubble.location.lon,
//       userLat,
//       userLon
//     );

//     console.log(
//       "[findCandidateSolversNearBubble] user",
//       doc.id,
//       "dist =",
//       dist
//     );

//     if (dist <= VISIBLE_RADIUS_METERS) {
//       candidates.push({
//         id: doc.id,
//         ...u,
//         distanceMeters: dist,
//       });
//     }
//   });

//   console.log(
//     "[findCandidateSolversNearBubble] candidates in radius =",
//     candidates.length
//   );

//   return candidates;
// }

// async function findCandidateSolversNearBubble(bubble) {
//   const usersRef = db.collection(USER_COLLECTION);

//   const snapshot = await usersRef
//     .where("status", "==", "active")
//     .where("is_ready", "==", true)
//     .where("active", "==", true)
//     .get();

//   const candidates = [];

//   snapshot.forEach((doc) => {
//     const u = doc.data();

//     const userLat = u.location?.lat;
//     const userLon = u.location?.lon;

//     if (typeof userLat !== "number" || typeof userLon !== "number") {

//       return;
//     }

//     const dist = getDistanceMeters(
//       bubble.location.lat,
//       bubble.location.lon,
//       userLat,
//       userLon
//     );

//     if (dist <= VISIBLE_RADIUS_METERS) {
//       candidates.push({
//         id: doc.id,
//         ...u,
//         distanceMeters: dist,
//       });
//     }
//   });

//   return candidates;
// }

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
    status: "pending",
    created_at: new Date(),
    message: null,
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

async function assignSolverForBubble(bubbleId) {
  const bubble = await getBubbleById(bubbleId);
  console.log("[assignSolverForBubble] bubble =", bubbleId, bubble?.status);
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

  const allCandidates = await findCandidateSolversNearBubble(bubble);
  console.log(
    "[assignSolverForBubble] allCandidates =",
    allCandidates.map((c) => c.line_id)
  );
  const candidates = allCandidates.filter(
    (solver) => solver.line_id !== bubble.requesterId
  );
  console.log(
    "[assignSolverForBubble] filtered candidates =",
    candidates.map((c) => c.line_id)
  );

  if (candidates.length === 0) {
    return { ok: false, reason: "NO_SOLVER_IN_RADIUS" };
  }

  const solver = pickRandomSolver(candidates);
  console.log(
    "LINNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN: ",
    solver.line_id
  );
  const roomId = await createRoomForMatch({ bubble, solver });

  await updateBubbleMatched({ bubbleId: bubble.id, solver, roomId });

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
}
async function solverAcceptForBubble(bubbleId, solverLineId) {
  if (!bubbleId || !solverLineId) {
    return { ok: false, reason: "MISSING_PARAM" };
  }

  const bubbleRef = db.collection(BUBBLE_COLLECTION).doc(bubbleId);
  const bubbleSnap = await bubbleRef.get();

  if (!bubbleSnap.exists) {
    return { ok: false, reason: "BUBBLE_NOT_FOUND" };
  }

  const bubbleData = bubbleSnap.data();
  const requesterId = bubbleData.requesterId;

  // ถ้าถูก match ไปแล้ว
  if (bubbleData.status === "MATCHED" && bubbleData.matchId) {
    // ถ้าเป็น solver คนเดิม → ให้เข้า room เดิม
    if (bubbleData.solverId === solverLineId) {
      return {
        ok: true,
        reason: "ALREADY_MATCHED",
        data: {
          roomId: bubbleData.matchId,
          bubble: { id: bubbleId, ...bubbleData },
        },
      };
    }

    // ถูกคนอื่นจับไปแล้ว
    return { ok: false, reason: "ALREADY_TAKEN" };
  }

  // สร้าง room ใหม่
  const roomRef = await db.collection(ROOM_COLLECTION).add({
    bubbleId,
    requesterId,
    solverId: solverLineId,
    status: "pending",
    created_at: new Date(),
    message: null,
  });

  const roomId = roomRef.id;

  // อัปเดต bubble
  await bubbleRef.update({
    status: "MATCHED",
    solverId: solverLineId,
    matchId: roomId,
    updatedAt: new Date(),
  });

  return {
    ok: true,
    reason: "MATCHED",
    data: {
      roomId,
      bubble: {
        id: bubbleId,
        ...bubbleData,
        solverId: solverLineId,
        matchId: roomId,
        status: "MATCHED",
      },
    },
  };
}

const matchService = {
  assignSolverForBubble,
  solverAcceptForBubble,

  async findSolverResult(bubbleId) {
    const result = await assignSolverForBubble(bubbleId);

    if (!result.ok) {
      switch (result.reason) {
        case "BUBBLE_NOT_FOUND":
          return {
            status: "ERROR",
            message: "ไม่พบ bubble นี้",
          };
        case "BUBBLE_NO_LOCATION":
          return {
            status: "ERROR",
            message: "bubble นี้ยังไม่มีข้อมูล location",
          };
        case "NO_SOLVER_IN_RADIUS":
          return {
            status: "NO_SOLVER",
            message: "ยังไม่มี solver ที่พร้อมในรัศมีตอนนี้",
          };
        default:
          return {
            status: "ERROR",
            message: "ไม่สามารถจับคู่ solver ได้ (unknown reason)",
          };
      }
    }

    const { bubbleId: bId, solverId, roomId } = result.data || {};

    return {
      status:
        result.reason === "ALREADY_MATCHED" ? "ALREADY_MATCHED" : "MATCHED",
      bubbleId: bId,
      solverId,
      roomId,
    };
  },
};

export default matchService;
