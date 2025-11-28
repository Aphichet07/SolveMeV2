import { admin, db } from "../firebase/admin.js";
import userStatsService from "./userStats.service.js";

/**
 * คำนวณระยะทางเป็นเมตรระหว่างสองพิกัด (Haversine formula)
 */
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // รัศมีโลก (เมตร)
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // เมตร
}

const bubbleService = {
  // ==================== GET BUBBLES (ทุกที่ ไม่สนระยะ) ====================

  async getBubbles(userId, location = null) {
    let queryRef = db.collection("bubbles").where("status", "==", "OPEN");

    if (userId) {
      // ถ้าอยาก filter ไม่ให้เห็น bubble ของตัวเองก็ทำเพิ่มตรงนี้ได้
      // queryRef = queryRef.where("requesterId", "!=", userId);
    }

    const snap = await queryRef.limit(100).get();
    const nowMs = Date.now();

    const items = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      const expiresAt = data.expiresAt || null;

      let timeRemainingMinutes = Number.POSITIVE_INFINITY;
      if (expiresAt && typeof expiresAt.toMillis === "function") {
        const diffMs = expiresAt.toMillis() - nowMs;
        timeRemainingMinutes = diffMs / 60000;
      }

      return {
        id: docSnap.id,
        ...data,
        _timeRemainingMinutes: timeRemainingMinutes,
      };
    });

    function priorityScore(p) {
      if (!p) return 0;
      const v = String(p).toUpperCase();
      if (v === "HIGH") return 3;
      if (v === "NORMAL") return 2;
      if (v === "LOW") return 1;
      return 0;
    }

    items.sort((a, b) => {
      const pa = priorityScore(a.priority);
      const pb = priorityScore(b.priority);

      if (pa !== pb) {
        return pb - pa; // priority สูงมาก่อน
      }

      const ta = a._timeRemainingMinutes;
      const tb = b._timeRemainingMinutes;

      // ใกล้หมดก่อน
      return ta - tb;
    });

    const top20 = items.slice(0, 20);
    return top20.map(({ _timeRemainingMinutes, ...rest }) => rest);
  },

  // ==================== CREATE BUBBLE ====================

  async createBubble(
    title,
    description,
    expiresInMinutes,
    userId,
    location = null,
    priority
  ) {
    const nowMs = Date.now();
    const expMs = Number(expiresInMinutes || 0) * 60 * 1000;

    const created_at = admin.firestore.FieldValue.serverTimestamp();
    const expiresAt =
      expMs > 0
        ? admin.firestore.Timestamp.fromMillis(nowMs + expMs)
        : null;

    const doc = {
      title,
      description,
      requesterId: userId,
      expiresInMinutes: Number(expiresInMinutes) || 0,
      status: "OPEN", // OPEN | MATCHED | CLOSED
      priority,
      created_at,
      expiresAt,
      location: location || null,
      // solverId: null,
      // matchId: null,
    };

    const docRef = await db.collection("bubbles").add(doc);

    try {
      await userStatsService.addRequest(userId);
    } catch (e) {
      console.warn("[bubbleService] addRequest error:", e);
    }

    return {
      id: docRef.id,
      ...doc,
    };
  },

  // ==================== NEARBY BUBBLES (ภายในรัศมี X เมตร) ====================

  async getNearbyBubbles(lat, lon, radiusMeters = 20) {
    const nowMs = Date.now();

    // ดึง OPEN bubbles มาก่อน สัก 200 อัน (แล้วค่อย filter ระยะในโค้ด)
    const snap = await db
      .collection("bubbles")
      .where("status", "==", "OPEN")
      .limit(200)
      .get();

    const items = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const loc = data.location;
      if (!loc || typeof loc.lat !== "number" || typeof loc.lon !== "number") {
        return; // ไม่มี location ข้าม
      }

      const dist = distanceInMeters(lat, lon, loc.lat, loc.lon);
      if (dist > radiusMeters) return; // นอก radius ก็ไม่เอา

      let timeRemainingMinutes = Number.POSITIVE_INFINITY;
      if (data.expiresAt && typeof data.expiresAt.toMillis === "function") {
        const diffMs = data.expiresAt.toMillis() - nowMs;
        timeRemainingMinutes = diffMs / 60000;
      }

      items.push({
        id: docSnap.id,
        ...data,
        _distanceMeters: dist,
        _timeRemainingMinutes: timeRemainingMinutes,
      });
    });

    function priorityScore(p) {
      if (!p) return 0;
      const v = String(p).toUpperCase();
      if (v === "HIGH") return 3;
      if (v === "NORMAL") return 2;
      if (v === "LOW") return 1;
      return 0;
    }

    items.sort((a, b) => {
      const pa = priorityScore(a.priority);
      const pb = priorityScore(b.priority);
      if (pa !== pb) return pb - pa; // priority สูงมาก่อน

      const ta = a._timeRemainingMinutes;
      const tb = b._timeRemainingMinutes;
      if (ta !== tb) return ta - tb; // ใกล้หมดก่อน

      return a._distanceMeters - b._distanceMeters; // ใกล้กว่า มาก่อน
    });

    const top20 = items.slice(0, 20);
    return top20.map(({ _distanceMeters, _timeRemainingMinutes, ...rest }) => rest);
  },

  // ==================== STUBS: DELETE / EDIT ====================

  async deleteBubble() {
    console.log("Delete");
  },

  async editBubble() {
    console.log("Edit");
  },

  // ==================== MATCH STATUS ====================

  /**
   * ใช้สำหรับ endpoint:
   *   GET /api/bubbles/:bubbleId/match-status
   *
   * return object ประมาณ:
   *  - { ok: true, data: { status: "MATCHED", solver: {...}, matchId: "roomId" } }
   *  - { ok: true, data: { status: "SEARCHING" } }
   *  - { ok: true, data: { status: "TIMEOUT" } }
   *  - { ok: false, reason: "NOT_FOUND" }
   */
  async getMatchStatus(bubbleId) {
    const docSnap = await db.collection("bubbles").doc(bubbleId).get();
    if (!docSnap.exists) {
      return {
        ok: false,
        reason: "NOT_FOUND",
      };
    }

    const data = docSnap.data();
    const bubble = { id: docSnap.id, ...data };

    // 1) กรณี MATCHED แล้ว
    if (bubble.status === "MATCHED" && bubble.solverId && bubble.matchId) {
      let solver = null;
      try {
        const solverSnap = await db
          .collection("users")
          .doc(bubble.solverId)
          .get();
        if (solverSnap.exists) {
          const s = solverSnap.data();
          solver = {
            id: solverSnap.id,
            name: s.display_name || s.name || "Solver",
            display_name: s.display_name,
            avatar_url: s.avatar_url,
          };
        }
      } catch (e) {
        console.warn("[bubbleService] getMatchStatus solver error:", e);
      }

      return {
        ok: true,
        data: {
          status: "MATCHED",
          solver,
          matchId: bubble.matchId,
        },
      };
    }

    // 2) เช็ค timeout
    const now = Date.now();
    if (bubble.expiresAt && typeof bubble.expiresAt.toMillis === "function") {
      const expMs = bubble.expiresAt.toMillis();
      if (now > expMs) {
        return {
          ok: true,
          data: {
            status: "TIMEOUT",
          },
        };
      }
    }

    // 3) ยังหา solver อยู่
    return {
      ok: true,
      data: {
        status: "SEARCHING",
      },
    };
  },

  // ==================== ACTIVE SOLVERS รอบ BUBBLE ====================

  /**
   * ใช้สำหรับ endpoint:
   *   GET /api/bubbles/solvers/active?bubbleId=...
   *
   * ดึง user ที่:
   *  - status == "active"
   *  - is_ready == true
   *  - active == true
   *  - อยู่ในรัศมี radiusMeters จาก location ของ bubble
   */
  async getActiveSolversAroundBubble(bubbleId, radiusMeters = 20) {
    if (!bubbleId) return [];

    const bubbleSnap = await db.collection("bubbles").doc(bubbleId).get();
    if (!bubbleSnap.exists) return [];

    const bubble = bubbleSnap.data();
    if (
      !bubble.location ||
      typeof bubble.location.lat !== "number" ||
      typeof bubble.location.lon !== "number"
    ) {
      return [];
    }

    const { lat: bubbleLat, lon: bubbleLon } = bubble.location;

    const userSnap = await db
      .collection("users")
      .where("status", "==", "active")
      .where("is_ready", "==", true)
      .where("active", "==", true)
      .limit(200)
      .get();

    const solvers = [];

    userSnap.forEach((doc) => {
      const u = doc.data();
      const loc = u.location;
      if (!loc || typeof loc.lat !== "number" || typeof loc.lon !== "number") {
        return;
      }

      const dist = distanceInMeters(bubbleLat, bubbleLon, loc.lat, loc.lon);
      if (dist > radiusMeters) return;

      solvers.push({
        id: doc.id,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        distanceMeters: dist,
      });
    });

    solvers.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return solvers;
  },
};

export default bubbleService;







