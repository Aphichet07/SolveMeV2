import userStatsService from "./userStats.service.js";
import { admin, db } from "../firebase/admin.js";
const profileStatsService = {
  /**
   * ดึงสถิติตาม lineId (LINE userId)
   * @param {string} lineId
   * @returns {Promise<{
   *   line_id: string,
   *   total_requests: number,
   *   total_solves: number,
   *   score: number,
   *   tier: string
   * } | null>}
   */
  async getStatsByLineId(lineId) {
    const docSnap = await userStatsService.findUserDocByLineId(lineId);
    if (!docSnap) {
      return null;
    }

    const data = docSnap.data() || {};

    return {
      line_id: lineId,
      total_requests: data.total_requests ?? 0,
      total_solves: data.total_solves ?? 0,
      score: data.score ?? 0,
      tier: data.tier || "Silver",
    };
  },

  async updateCarryProfile({ line_id, carry_profile }) {
    if (!line_id) {
      throw new Error("line_id is required");
    }
    if (!carry_profile || typeof carry_profile !== "object") {
      throw new Error("carry_profile must be an object");
    }

    const userRef = db.collection("users").doc(line_id);

    await userRef.set(
      {
        carry_profile,
        carry_profile_completed: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const snap = await userRef.get();
    if (!snap.exists) {
      throw new Error("User not found after updating carry_profile");
    }

    const userData = snap.data();

    return {
      id: snap.id,
      ...userData,
    };
  },
  
};

export default profileStatsService;



// import { admin, db } from "../firebase/admin.js";

// const profileService = {
//   async updateCarryProfile({ line_id, carry_profile }) {
//     if (!line_id) {
//       throw new Error("line_id is required");
//     }
//     if (!carry_profile || typeof carry_profile !== "object") {
//       throw new Error("carry_profile must be an object");
//     }

//     const userRef = db.collection("users").doc(line_id);

//     await userRef.set(
//       {
//         carry_profile,
//         carry_profile_completed: true,
//         updated_at: admin.firestore.FieldValue.serverTimestamp(),
//       },
//       { merge: true }
//     );

//     const snap = await userRef.get();
//     if (!snap.exists) {
//       throw new Error("User not found after updating carry_profile");
//     }

//     const userData = snap.data();

//     return {
//       id: snap.id,
//       ...userData,
//     };
//   },
// };

// export default profileService;
