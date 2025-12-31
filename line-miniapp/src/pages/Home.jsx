import "../App.css";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import FooterNav from "../components/footer.jsx";
import Header from "../components/header.jsx";
import SearchBar from "../components/searchbar.jsx";
import BubbleList from "../components/bubblelist.jsx";
import BubbleDetailModal from "../components/BubbleDetailModel.jsx";
import DailyQuestAccordion from "../components/dairy.jsx";
import SolverWaitToggle from "../components/SolverWaitToggle.jsx";

const POLL_INTERVAL_MS = 10_000;
const NEARBY_RADIUS_METERS = 70;
const MAX_TITLE_LEN = 40;
const MAX_DESC_LEN = 80;

function toMillisFromFirestoreTimestamp(ts) {
  if (!ts) return null;
  if (ts._seconds != null) {
    const seconds = ts._seconds;
    const nanos = ts._nanoseconds || 0;
    return seconds * 1000 + Math.floor(nanos / 1e6);
  }
  const parsed = new Date(ts);
  return isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function formatBubbleData(raw) {
  let title = raw.title || "";
  if (title.length > MAX_TITLE_LEN) {
    title = title.slice(0, MAX_TITLE_LEN - 1) + "…";
  }
  let description = raw.description || "";
  if (description.length > MAX_DESC_LEN) {
    description = description.slice(0, MAX_DESC_LEN - 1) + "…";
  }
  let expiresAtMs = null;
  if (raw.expiresAt) {
    expiresAtMs = toMillisFromFirestoreTimestamp(raw.expiresAt);
  } else if (raw.created_at && raw.expiresInMinutes != null) {
    const createdMs = toMillisFromFirestoreTimestamp(raw.created_at);
    if (createdMs != null) {
      expiresAtMs = createdMs + raw.expiresInMinutes * 60 * 1000;
    }
  }
  return {
    id: raw.id,
    title,
    description,
    profile: raw.requesterId || "Anonymous",
    priority: raw.priority,
    cetegory: raw.cetegory,
    expiresAtMs,
    raw,
  };
}

function HomePage({ profile, role, geo, geoError, geoLoading }) {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  // Heartbeat Logic
  useEffect(() => {
    if (!profile?.userId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_BASE}/api/auth/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ line_id: profile.userId }),
        });
      } catch (err) {
        console.error("heartbeat error:", err);
      }
    };

    sendHeartbeat();
    const id = setInterval(sendHeartbeat, 30 * 1000);
    return () => clearInterval(id);
  }, [profile?.userId, API_BASE]);

  // Bubble list state
  const [bubbles, setBubbles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchText, setSearchText] = useState("");

  // Detail modal state
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  // Polling bubble list
  useEffect(() => {
    let isCancelled = false;
    let intervalId = null;

    async function fetchBubbles() {
      if (isCancelled) return;
      if (role !== "requester" && role !== "solver") return;
      if (role === "solver" && !geo) return;

      setIsLoading(true);
      setErrorMsg("");

      try {
        let url = "";
        if (role === "requester") {
          url = `${API_BASE}/api/bubbles/list`;
        } else if (role === "solver") {
          const params = new URLSearchParams({
            lat: String(geo.lat),
            lon: String(geo.lon),
            radiusMeters: String(NEARBY_RADIUS_METERS),
          });
          url = `${API_BASE}/api/bubbles/nearby?${params.toString()}`;
        }

        const res = await fetch(url, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load bubbles");
        }

        const data = await res.json();
        const formatted = (data || []).map(formatBubbleData);

        if (!isCancelled) setBubbles(formatted);
      } catch (err) {
        console.error("fetchBubbles error:", err);
        if (!isCancelled) setErrorMsg(err.message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchBubbles();
    intervalId = setInterval(fetchBubbles, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [role, geo, API_BASE]);

  // Filter bubbles
  const filteredBubbles = useMemo(() => {
    const now = Date.now();
    const q = searchText.trim().toLowerCase();
    return bubbles.filter((b) => {
      if (b.expiresAtMs && b.expiresAtMs <= now) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    });
  }, [bubbles, searchText]);

  // Actions
  const handleOpenBubbleDetail = (bubble) => {
    setSelectedBubble(bubble);
    setIsDetailOpen(true);
  };

  const handleCloseBubbleDetail = () => {
    setIsDetailOpen(false);
    setSelectedBubble(null);
  };

  const handleMatchBubble = async (bubble) => {
    if (!bubble || !profile?.userId || role !== "solver") return;

    try {
      setIsMatching(true);
      const res = await fetch(`${API_BASE}/api/match/solver-accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bubbleId: bubble.id,
          solverLineId: profile.userId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Cannot create chat room");
        return;
      }

      if (data.status === "MATCHED" || data.status === "ALREADY_MATCHED") {
        const roomId = data.roomId;
        // Navigation: ไปหน้า Chat พร้อมส่ง state ไปด้วย
        setIsDetailOpen(false);
        navigate(`/chat/${roomId}`, {
          state: {
            bubble: data.bubble || bubble,
            roomId: roomId,
          },
        });
      }
    } catch (err) {
      console.error("match bubble error:", err);
      alert("Error creating chat room");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        <Header />

        <main className="flex-1 px-4 pt-2 pb-24">
          <SearchBar value={searchText} onChange={setSearchText} />

          {role === "solver" && (
            <>
              <div className="mb-3">
                <DailyQuestAccordion
                  lineId={profile?.userId}
                  className="text-[12px]"
                />
              </div>
              <SolverWaitToggle
                profile={profile}
                geo={geo}
                initialWaitMode={profile?.wait_mode}
              />
            </>
          )}

          {errorMsg && (
            <div className="mt-2 text-[11px] text-red-500">{errorMsg}</div>
          )}

          {role === "solver" && geoLoading && !geo && (
            <div className="mt-1 text-[11px] text-slate-500">
              กำลังดึงตำแหน่ง...
            </div>
          )}

          {role === "solver" && geoError && (
            <div className="mt-1 text-[11px] text-red-500">{geoError}</div>
          )}

          <p className="mt-1 text-[11px] text-slate-500">
            {role === "solver"
              ? "กำลังแสดงปัญหาที่อยู่ใกล้คุณ (ประมาณ 70 เมตร)"
              : "กำลังแสดงปัญหาที่ถูกสร้างในระบบ"}
          </p>

          <BubbleList
            items={filteredBubbles}
            isLoading={isLoading}
            onItemClick={handleOpenBubbleDetail}
          />
        </main>

        <FooterNav
          onPlusClick={() => navigate("/create-request")}
          onProfileClick={() => navigate("/profile")}
          onWalletClick={() => navigate("/wallet")}
        />

        <BubbleDetailModal
          open={isDetailOpen}
          bubble={selectedBubble}
          onClose={handleCloseBubbleDetail}
          onMatch={handleMatchBubble}
          isMatching={isMatching}
        />
      </div>
    </div>
  );
}

export default HomePage;
