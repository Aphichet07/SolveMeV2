import { admin, db } from "../firebase/admin.js";

const userService = {
  async upsertUserOnEnter({ line_id, display_name, avatar_url }) {
    const usersCol = db.collection("users");
    const snap = await usersCol.where("line_id", "==", line_id).limit(1).get();
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (snap.empty) {
      const doc = {
        line_id,
        display_name: display_name || "",
        avatar_url: avatar_url || "",
        status: "active",
        is_ready: false,
        active: true,
        last_active_at: now,
        created_at: now,
        updated_at: now,
      };

      // 🔧 แก้จาก usersRef → usersCol
      const ref = await usersCol.add(doc);
      return { id: ref.id, ...doc };
    } else {
      const docSnap = snap.docs[0];
      const ref = docSnap.ref;
      const data = docSnap.data();

      const update = {
        display_name: display_name || data.display_name,
        avatar_url: avatar_url || data.avatar_url,
        status: "active",
        active: true,
        last_active_at: now,
        updated_at: now,

        // 🔧 แก้จาก existing → data
        total_requests: data.total_requests ?? 0,
        total_solves: data.total_solves ?? 0,
        score: data.score ?? 0,
      };

      await ref.update(update);
      return { id: ref.id, ...data, ...update };
    }
  },

  async updateHeartbeat(line_id) {
    const usersRef = db.collection("users");
    const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();
    if (snap.empty) return;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const ref = snap.docs[0].ref;

    await ref.update({
      last_active_at: now,
      active: true,
      updated_at: now,
    });
  },

  async setUserReady(line_id, is_ready) {
    const usersRef = db.collection("users");
    const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();

    if (snap.empty) {
      throw new Error("user not found");
    }

    const docSnap = snap.docs[0];
    const ref = docSnap.ref;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const update = {
      is_ready: is_ready,
      active: is_ready ? true : false,
      last_active_at: now,
      updated_at: now,
    };

    await ref.update(update);

    return { id: ref.id, ...docSnap.data(), ...update };
  },
};

export default userService;


// import { admin, db } from "../firebase/admin.js";

// const userService = {
//     async upsertUserOnEnter({ line_id, display_name, avatar_url }) {
//         const usersCol = db.collection("users");
//         const snap = await usersCol.where("line_id", "==", line_id).limit(1).get();
//         const now = admin.firestore.FieldValue.serverTimestamp();

//         if (snap.empty) {

//             const doc = {
//                 line_id,
//                 display_name: display_name || "",
//                 avatar_url: avatar_url || "",
//                 status: "active",
//                 is_ready: false,
//                 active: true,
//                 last_active_at: now,
//                 created_at: now,
//                 updated_at: now,
//             };
//             // 🔧 แก้จาก usersRef → usersCol (ตัวแปรจริง)
//             const ref = await usersCol.add(doc);
//             return { id: ref.id, ...doc };
//         } else {
//             const docSnap = snap.docs[0];
//             const ref = docSnap.ref;
//             const data = docSnap.data();

//             const update = {
//                 display_name: display_name || data.display_name,
//                 avatar_url: avatar_url || data.avatar_url,
//                 status: "active",
//                 active: true,
//                 last_active_at: now,
//                 updated_at: now,

//                 // 🔧 แก้จาก existing → data (ตัวแปรที่มีจริง)
//                 total_requests: data.total_requests ?? 0,
//                 total_solves: data.total_solves ?? 0,
//                 score: data.score ?? 0,
//             };

//             await ref.update(update);
//             return { id: ref.id, ...data, ...update };
//         }

//         // โค้ดด้านล่างนี้จะไม่ถูกเรียกถึง (เพราะ return ไปแล้วด้านบน)
//         // ผมไม่ลบออกตามที่คุณบอกว่า "ห้ามแก้ logic แก้แค่บัค"

//         const newUser = {
//             line_id,
//             display_name: display_name || null,
//             avatar_url: avatar_url || null,
//             status: "active",
//             active: true,
//             is_ready: false,
//             created_at: now,
//             updated_at: now,

//             total_requests: 0,
//             total_solves: 0,
//             score: 0,
//         };

//         const ref = await usersCol.add(newUser);

//         return {
//             id: ref.id,
//             ...newUser,
//         };
//     },

//     async updateHeartbeat(line_id) {
//         const usersRef = db.collection("users");
//         const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();
//         if (snap.empty) return;

//         const now = admin.firestore.FieldValue.serverTimestamp();
//         const ref = snap.docs[0].ref;

//         await ref.update({
//             last_active_at: now,
//             active: true,
//             updated_at: now,
//         });
//     },

//     async setUserReady(line_id, is_ready) {
//         const usersRef = db.collection("users");
//         const snap = await usersRef.where("line_id", "==", line_id).limit(1).get();

//         if (snap.empty) {
//             throw new Error("user not found");
//         }

//         const docSnap = snap.docs[0];
//         const ref = docSnap.ref;
//         const now = admin.firestore.FieldValue.serverTimestamp();

//         const update = {
//             is_ready: is_ready,
//             active: is_ready ? true : false,
//             last_active_at: now,
//             updated_at: now,
//         };

//         await ref.update(update);

//         return { id: ref.id, ...docSnap.data(), ...update };
//     },

// };

// export default userService;


