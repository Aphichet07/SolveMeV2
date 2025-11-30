import { admin, db } from "../firebase/admin.js";

const { FieldValue } = admin.firestore;
const USERS_COLLECTION = "users";
function isValidLocation(location) {
  return (
    location &&
    typeof location.lat === "number" &&
    typeof location.lon === "number"
  );
}

const userService = {
  async upsertUserOnEnter({ line_id, display_name, avatar_url, location }) {
    if (!line_id) {
      throw new Error("line_id is required");
    }

    const userRef = db.collection("users").doc(line_id);
    const snap = await userRef.get();
    const now = FieldValue.serverTimestamp();

    // สร้าง user ใหม่
    if (!snap.exists) {
      const newUser = {
        line_id,
        display_name: display_name || null,
        avatar_url: avatar_url || null,
        created_at: now,
        updated_at: now,

        total_requests: 0,
        total_solves: 0,
        score: 0,

        carry_profile: null,
        carry_profile_completed: false,
      };

      if (isValidLocation(location)) {
        newUser.last_location = {
          lat: location.lat,
          lon: location.lon,
        };
        newUser.last_location_at = now;
      }

      await userRef.set(newUser);
      return { id: userRef.id, ...newUser };
    }

    // อัปเดต user
    const existing = snap.data();
    const updates = {
      updated_at: now,
    };

    if (display_name && display_name !== existing.display_name) {
      updates.display_name = display_name;
    }

    if (avatar_url && avatar_url !== existing.avatar_url) {
      updates.avatar_url = avatar_url;
    }

    if (isValidLocation(location)) {
      updates.last_location = {
        lat: location.lat,
        lon: location.lon,
      };
      updates.last_location_at = now;
    }

    await userRef.set(updates, { merge: true });

    const freshSnap = await userRef.get();
    return { id: freshSnap.id, ...freshSnap.data() };
  },

  // ให้ client เรียกทุก ๆ 30–60 วินาที
  async updateHeartbeat(line_id) {
    if (!line_id) return;

    const usersRef = db.collection(USERS_COLLECTION);
    const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();
    if (snap.empty) return;

    const ref = snap.docs[0].ref;
    const now = FieldValue.serverTimestamp();

    await ref.update({
      last_active_at: now,
      active: true,
      updated_at: now,
    });
  },

  // mark user ที่หายไปนานเป็น inactive
  // thresholdMinutes = กี่นาทีไม่มี heartbeat ถือว่า offline
  async markInactiveUsers(thresholdMinutes = 5) {
    const now = Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;

    const snap = await db
      .collection(USERS_COLLECTION)
      .where("active", "==", true)
      .get();

    const batch = db.batch();

    snap.forEach((doc) => {
      const data = doc.data();
      const lastActive = data.last_active_at;

      if (!lastActive || typeof lastActive.toMillis !== "function") {
        // ไม่มี last_active_at → ถือว่า offline เลย
        batch.update(doc.ref, {
          active: false,
          is_ready: false,
          updated_at: FieldValue.serverTimestamp(),
        });
        return;
      }

      const lastMs = lastActive.toMillis();
      if (now - lastMs > thresholdMs) {
        batch.update(doc.ref, {
          active: false,
          is_ready: false,
          updated_at: FieldValue.serverTimestamp(),
        });
      }
    });

    if (!snap.empty) {
      await batch.commit();
      console.log(
        "[userService] markInactiveUsers done for",
        snap.size,
        "users"
      );
    }
  },

  /**
   * setUserReady
   * - ใช้ตอน user กดเลือกบทบาท / พร้อมจะเป็น solver/requester
   * - อัปเดต is_ready, active, last_active_at, updated_at
   * - ถ้าให้ location มาด้วย จะอัปเดต last_location ด้วย
   */
  async setUserReady({ line_id, is_ready, location }) {
    if (!line_id) {
      throw new Error("line_id is required");
    }

    const usersRef = db.collection("users");
    const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();

    if (snap.empty) {
      throw new Error("user not found");
    }

    const docSnap = snap.docs[0];
    const ref = docSnap.ref;
    const now = FieldValue.serverTimestamp();

    const update = {
      is_ready: !!is_ready,
      active: !!is_ready,
      last_active_at: now,
      updated_at: now,
    };

    if (isValidLocation(location)) {
      update.last_location = {
        lat: location.lat,
        lon: location.lon,
      };
      update.last_location_at = now;
    }

    await ref.update(update);

    console.log("[userService.setUserReady] user snapshot:", docSnap.data());

    return { id: ref.id, ...docSnap.data(), ...update };
  },
};

export default userService;

// import { admin, db } from "../firebase/admin.js";

// const userService = {
//   async upsertUserOnEnter({ line_id, display_name, avatar_url, location }) {
//     if (!line_id) {
//       throw new Error("line_id is required");
//     }

//     const userRef = db.collection("users").doc(line_id);
//     const snap = await userRef.get();
//     const now = admin.firestore.FieldValue.serverTimestamp();

//     if (!snap.exists) {
//       const newUser = {
//         line_id,
//         display_name: display_name || null,
//         avatar_url: avatar_url || null,
//         created_at: now,
//         updated_at: now,
//         total_requests: 0,
//         total_solves: 0,
//         score: 0,
//         carry_profile: null,
//         carry_profile_completed: false,
//       };

//       if (
//         location &&
//         typeof location.lat === "number" &&
//         typeof location.lon === "number"
//       ) {
//         newUser.last_location = {
//           lat: location.lat,
//           lon: location.lon,
//         };
//         newUser.last_location_at = now;
//       }

//       await userRef.set(newUser);
//       return { id: userRef.id, ...newUser };
//     }

//     const existing = snap.data();

//     const updates = {
//       updated_at: now,
//     };

//     if (display_name && display_name !== existing.display_name) {
//       updates.display_name = display_name;
//     }

//     if (avatar_url && avatar_url !== existing.avatar_url) {
//       updates.avatar_url = avatar_url;
//     }

//     if (
//       location &&
//       typeof location.lat === "number" &&
//       typeof location.lon === "number"
//     ) {
//       updates.last_location = {
//         lat: location.lat,
//         lon: location.lon,
//       };
//       updates.last_location_at = now;
//     }

//     await userRef.set(updates, { merge: true });

//     const freshSnap = await userRef.get();
//     return { id: freshSnap.id, ...freshSnap.data() };
//   },

//   async updateHeartbeat(line_id) {
//     const usersRef = db.collection("users");
//     const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();
//     if (snap.empty) return;

//     const now = admin.firestore.FieldValue.serverTimestamp();
//     const ref = snap.docs[0].ref;

//     await ref.update({
//       last_active_at: now,
//       active: true,
//       updated_at: now,
//     });
//   },
//   async setUserReady({ line_id, is_ready, location }) {
//     if (!line_id) {
//       throw new Error("line_id is required");
//     }

//     const usersRef = db.collection("users");
//     const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();

//     if (snap.empty) {
//       throw new Error("user not found");
//     }

//     const docSnap = snap.docs[0];
//     const ref = docSnap.ref;
//     const now = admin.firestore.FieldValue.serverTimestamp();

//     const update = {
//       is_ready: !!is_ready,
//       active: !!is_ready,
//       last_active_at: now,
//       updated_at: now,
//     };

//     if (
//       location &&
//       typeof location.lat === "number" &&
//       typeof location.lon === "number"
//     ) {
//       update.last_location = {
//         lat: location.lat,
//         lon: location.lon,
//       };
//       update.last_location_at = now;
//     }

//     await ref.update(update);

//     console.log("Location from service : ", docSnap.data());
//     return { id: ref.id, ...docSnap.data(), ...update };
//   },

// };

// export default userService;
