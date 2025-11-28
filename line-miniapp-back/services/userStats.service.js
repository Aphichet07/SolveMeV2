// services/userStats.service.js
import { admin, db } from "../firebase/admin.js";
const USERS_COLLECTION = "users";
const FieldValue = admin.firestore.FieldValue;

const SCORE_PER_REQUEST = 1;
const SCORE_PER_SOLVE = 5;

const userStatsService = {
  async findUserDocByLineId(lineId) {
    const snap = await db
      .collection(USERS_COLLECTION)
      .where("line_id", "==", lineId)
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0];
  },

  async incrementUserStats({ lineId, deltaRequest = 0, deltaSolve = 0 }) {
    const docSnap = await this.findUserDocByLineId(lineId);
    if (!docSnap) {
      console.warn("[userStats] user not found for lineId =", lineId);
      return;
    }

    const ref = docSnap.ref;

    const scoreInc =
      deltaRequest * SCORE_PER_REQUEST + deltaSolve * SCORE_PER_SOLVE;

    const updateData = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (deltaRequest !== 0) {
      updateData.total_requests = FieldValue.increment(deltaRequest);
    }
    if (deltaSolve !== 0) {
      updateData.total_solves = FieldValue.increment(deltaSolve);
    }
    if (scoreInc !== 0) {
      updateData.score = FieldValue.increment(scoreInc);
    }

    await ref.update(updateData);
  },

  async addRequest(lineId) {
    return this.incrementUserStats({ lineId, deltaRequest: 1 });
  },

  async addSolve(lineId) {
    return this.incrementUserStats({ lineId, deltaSolve: 1 });
  },
};

export default userStatsService;

// async function findUserDocByLineId(lineId) {
//     const snap = await db
//         .collection(USERS_COLLECTION)
//         .where("line_id", "==", lineId)
//         .limit(1)
//         .get();

//     if (snap.empty) return null;
//     return snap.docs[0]; // Firestore DocumentSnapshot
// }

// async function incrementUserStats({ lineId, deltaRequest = 0, deltaSolve = 0 }) {
//     const docSnap = await findUserDocByLineId(lineId);
//     if (!docSnap) {
//         console.warn("[userStats] user not found for lineId =", lineId);
//         return;
//     }

//     const ref = docSnap.ref;

//     const scoreInc =
//         deltaRequest * SCORE_PER_REQUEST + deltaSolve * SCORE_PER_SOLVE;

//     const updateData = {
//         updated_at: FieldValue.serverTimestamp(),
//     };

//     if (deltaRequest !== 0) {
//         updateData.total_requests = FieldValue.increment(deltaRequest);
//     }
//     if (deltaSolve !== 0) {
//         updateData.total_solves = FieldValue.increment(deltaSolve);
//     }
//     if (scoreInc !== 0) {
//         updateData.score = FieldValue.increment(scoreInc);
//     }

//     await ref.update(updateData);
// }

// async function addRequest(lineId) {
//     return incrementUserStats({ lineId, deltaRequest: 1 });
// }

// async function addSolve(lineId) {
//     return incrementUserStats({ lineId, deltaSolve: 1 });
// }

// export default {
//     addRequest,
//     addSolve,
// };
