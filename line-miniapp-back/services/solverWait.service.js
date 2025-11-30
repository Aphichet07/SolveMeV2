// services/solverWait.service.js
import { admin, db } from "../firebase/admin.js";

const USERS_COLLECTION = "users";
const FieldValue = admin.firestore.FieldValue;

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
 * เปิด/ปิด wait_mode ของ solver
 *
 * @param {Object} params
 * @param {string} params.lineId   line_id จาก LINE profile
 * @param {boolean} params.wait    true = เปิดรอเคส / false = ปิดรับเคส
 * @param {{lat:number, lon:number}=} params.location  ตำแหน่งล่าสุด (optional)
 */
async function setWaitMode({ lineId, wait, location }) {
  const docSnap = await findUserDocByLineId(lineId);
  if (!docSnap) {
    throw new Error("user not found for this line_id");
  }

  const ref = docSnap.ref;
  const now = FieldValue.serverTimestamp();

  const update = {
    updated_at: now,
    wait_mode: !!wait,
    is_ready: !!wait,  // เปิด wait ก็ถือว่าพร้อมรับเคส
    active: !!wait,    // ใช้ active ร่วมด้วย
    last_active_at: now,
  };

  if (
    location &&
    typeof location.lat === "number" &&
    typeof location.lon === "number"
  ) {
    update.last_location = {
      lat: location.lat,
      lon: location.lon,
    };
    update.last_location_at = now;
  }

  await ref.update(update);

  // ส่งค่ากลับเพื่อ debug/ใช้ฝั่ง frontend ได้
  const fresh = await ref.get();
  return { id: fresh.id, ...fresh.data() };
}

export default {
  setWaitMode,
};
