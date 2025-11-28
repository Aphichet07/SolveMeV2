import { admin, db } from "../firebase/admin.js";

const profileService = {
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

export default profileService;
