import { db } from "../firebase/admin.js";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

async function pingUser(userId) {
  const now = new Date();

  await db.collection("users").doc(userId).set(
    {
      isOnline: true,
      lastActiveAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  return { userId, lastActiveAt: now };
}

function isUserRecentlyActive(lastActiveAt) {
  if (!lastActiveAt) return false;

  const last =
    lastActiveAt instanceof Date
      ? lastActiveAt.getTime()
      : lastActiveAt.toDate
      ? lastActiveAt.toDate().getTime()
      : new Date(lastActiveAt).getTime();

  const now = Date.now();
  return now - last < ONLINE_THRESHOLD_MS;
}

async function getUserWithOnlineStatus(userId) {
  const snap = await db.collection("users").doc(userId).get();
  if (!snap.exists) return null;

  const data = snap.data();
  const online = isUserRecentlyActive(data.lastActiveAt);

  return {
    id: snap.id,
    ...data,
    computedOnline: online,
  };
}

export default {
  pingUser,
  isUserRecentlyActive,
  getUserWithOnlineStatus,
  ONLINE_THRESHOLD_MS,
};
