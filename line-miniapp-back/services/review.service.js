import { admin, db } from "../firebase/admin.js";

const REVIEWS_COLLECTION = "reviews";
const USERS_COLLECTION = "users";
const FieldValue = admin.firestore.FieldValue;

/**
 * หา doc ของ user จาก line_id (userId ที่ได้จาก Line)
 */
async function findUserDocByLineId(lineId) {
  const snap = await db
    .collection(USERS_COLLECTION)
    .where("line_id", "==", lineId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0];
}

/**
 * อัปเดตคะแนนรีวิวให้ user คนที่โดนรีวิว
 * - เพิ่ม rating_sum
 * - เพิ่ม rating_count
 */
async function addRatingToUser(lineId, score) {
  const docSnap = await findUserDocByLineId(lineId);
  if (!docSnap) {
    console.warn("[reviewService] user not found for lineId =", lineId);
    return;
  }

  const ref = docSnap.ref;

  await ref.update({
    updated_at: FieldValue.serverTimestamp(),
    rating_sum: FieldValue.increment(score),
    rating_count: FieldValue.increment(1),
  });
}

/**
 * สร้างรีวิว 1 record + อัปเดตคะแนนให้คนถูกรีวิว
 *
 * @param {Object} params
 * @param {string} params.matchId      roomId/matchId ของห้องแชท
 * @param {string} params.bubbleId     bubble ที่เกี่ยวข้อง (optional ได้)
 * @param {string} params.fromUserId   คนให้ดาว (line userId)
 * @param {string} params.toUserId     คนถูกให้ดาว (line userId)
 * @param {number} params.score        1–5 ดาว
 * @param {string} [params.comment]    คอมเมนต์เพิ่มเติม (optional)
 */
async function submitReview({
  matchId,
  bubbleId,
  fromUserId,
  toUserId,
  score,
  comment,
}) {
  if (!matchId || !fromUserId || !toUserId) {
    throw new Error("matchId, fromUserId, toUserId is required");
  }

  const nScore = Number(score);
  if (!Number.isFinite(nScore) || nScore < 1 || nScore > 5) {
    throw new Error("score must be 1–5");
  }

  // 1) บันทึกรีวิว
  const reviewDoc = {
    match_id: matchId,
    bubble_id: bubbleId || null,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    score: nScore,
    comment: comment || null,
    created_at: FieldValue.serverTimestamp(),
  };

  await db.collection(REVIEWS_COLLECTION).add(reviewDoc);

  // 2) อัปเดตคะแนนฝั่งคนถูกรีวิว
  await addRatingToUser(toUserId, nScore);

  return { ok: true };
}

const reviewService = {
  submitReview,
};

export default reviewService;
