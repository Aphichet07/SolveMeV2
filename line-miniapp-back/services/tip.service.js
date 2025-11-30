import { db, admin } from "../firebase/admin.js";

const TIP_COLLECTION = "tips";
const USER_COLLECTION = "users";

async function createTip({ match_id, bubble_id, from_user_id, to_user_id, amount }) {
  if (!match_id || !from_user_id || !to_user_id || !amount) {
    throw new Error("match_id, from_user_id, to_user_id, amount are required");
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  // บันทึก tip record
  const tipRef = await db.collection(TIP_COLLECTION).add({
    match_id,
    bubble_id: bubble_id || null,
    from_user_id,
    to_user_id,
    amount: Number(amount),
    created_at: now,
  });

  // อัปเดตสถิติของ solver
  const solverRef = db.collection(USER_COLLECTION).doc(to_user_id);
  await solverRef.set(
    {
      tip_balance: admin.firestore.FieldValue.increment(Number(amount)),
      total_tips_received: admin.firestore.FieldValue.increment(1),
      total_tip_amount: admin.firestore.FieldValue.increment(Number(amount)),
      updated_at: now,
    },
    { merge: true }
  );

  const tipSnap = await tipRef.get();
  return { id: tipRef.id, ...tipSnap.data() };
}

const tipService = {
  createTip,
};

export default tipService;
