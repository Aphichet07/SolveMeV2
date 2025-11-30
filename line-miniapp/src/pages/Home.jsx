import "../App.css";
import React, { useState, useEffect, useMemo } from "react";

import FooterNav from "../components/footer";
import Header from "../components/header";
import SearchBar from "../components/searchbar";
import BubbleList from "../components/bubblelist";
import BubbleDetailModal from "../components/BubbleDetailModel.jsx";

import CreateBubblePage from "./createBubble";
import ProfilePage from "./profile.jsx";
import WalletPage from "./wallet.jsx";
import WaitingForSolverPage from "./waiting.jsx";
import ChatPage from "./chat.jsx";
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
    distanceText: null,
    priority: raw.priority,
    cetegory: raw.cetegory,
    expiresAtMs,
    raw,
  };
}

function HomePage({
  profile,
  idToken,
  role,
  initialRoom, // { roomId, bubble, otherUser? }
  geo,
  geoError,
  geoLoading,
}) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  function useHeartbeat(lineUserId) {
    useEffect(() => {
      if (!lineUserId) return;

      const sendHeartbeat = async () => {
        try {
          await fetch(`${API_BASE}/api/auth/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ line_id: lineUserId }),
          });
        } catch (err) {
          console.error("heartbeat error:", err);
        }
      };

      sendHeartbeat();

      const id = setInterval(sendHeartbeat, 30 * 1000);

      return () => clearInterval(id);
    }, [lineUserId]);
  }

  const [view, setView] = useState(initialRoom ? "chat" : "home"); // "home" | "profile" | "wallet" | "create" | "waiting" | "chat"

  const [currentBubble, setCurrentBubble] = useState(
    initialRoom?.bubble || null
  );
  const [currentRoomId, setCurrentRoomId] = useState(
    initialRoom?.roomId || null
  );
  const [currentOtherUser, setCurrentOtherUser] = useState(
    initialRoom?.otherUser || null
  );

  // Bubble list state
  const [bubbles, setBubbles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchText, setSearchText] = useState("");

  // Detail modal state
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const [tipContext, setTipContext] = useState(null);
  // Navigation helpers
  const goToProfile = () => setView("profile");
  const goToWallet = () => setView("wallet");
  const goToCreate = () => setView("create");

  useHeartbeat(profile?.userId);

  const goToWaiting = (bubble) => {
    if (!bubble) return;
    setCurrentBubble(bubble);
    setView("waiting");
  };

  const goToChat = ({ bubble, roomId, otherUser }) => {
    if (!roomId) {
      console.warn("[goToChat] roomId is required");
      return;
    }

    setCurrentBubble(bubble || null);
    setCurrentRoomId(roomId);
    setCurrentOtherUser(otherUser || null);
    setView("chat");
  };

  const goHome = () => setView("home");

  const goHomeAndResetSession = () => {
    setView("home");
    setCurrentBubble(null);
    setCurrentRoomId(null);
    setCurrentOtherUser(null);
  };

  // Polling bubble list
  useEffect(() => {
    let isCancelled = false;
    let intervalId = null;

    async function fetchBubbles() {
      if (isCancelled) return;

      // ถ้า role ไม่ใช่ requester หรือ solver ยังไม่ต้องโหลดอะไร
      if (role !== "requester" && role !== "solver") {
        return;
      }

      // solver ต้องมี geo ถึงจะโหลด nearby ได้
      if (role === "solver" && !geo) {
        return;
      }

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
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.message ||
              (role === "solver"
                ? "โหลด bubble ใกล้คุณไม่สำเร็จ"
                : "โหลด bubble ไม่สำเร็จ")
          );
        }

        const data = await res.json();
        const formatted = (data || []).map(formatBubbleData);

        if (!isCancelled) {
          setBubbles(formatted);
        }
      } catch (err) {
        console.error("fetchBubbles error:", err);
        if (!isCancelled) {
          setErrorMsg(
            err.message ||
              (role === "solver"
                ? "เกิดข้อผิดพลาดในการโหลด bubble ใกล้คุณ"
                : "เกิดข้อผิดพลาดในการโหลด bubble")
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchBubbles();
    intervalId = setInterval(fetchBubbles, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [role, geo, API_BASE]);

  // Filter bubbles (search + expired)
  const filteredBubbles = useMemo(() => {
    const now = Date.now();
    const q = searchText.trim().toLowerCase();

    return bubbles.filter((b) => {
      if (b.expiresAtMs && b.expiresAtMs <= now) {
        return false;
      }
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    });
  }, [bubbles, searchText]);

  // Callbacks
  const handleRequesterMatched = ({ bubble, roomId, solver }) => {
    goToChat({
      bubble,
      roomId,
      otherUser: solver || null,
    });
  };

  const handleOpenBubbleDetail = (bubble) => {
    setSelectedBubble(bubble);
    setIsDetailOpen(true);
  };

  const handleCloseBubbleDetail = () => {
    setIsDetailOpen(false);
    setSelectedBubble(null);
  };

  const handleMatchBubble = async (bubble) => {
    if (!bubble || !profile?.userId) return;
    if (role !== "solver") return;

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
        if (data.status === "ALREADY_TAKEN") {
          alert("เคสนี้ถูก solver คนอื่นรับไปแล้ว");
        } else if (data.status === "BUBBLE_NOT_FOUND") {
          alert("ไม่พบปัญหานี้แล้วในระบบ");
        } else {
          alert(data.message || "ไม่สามารถสร้างห้องแชทได้");
        }
        return;
      }

      if (data.status === "MATCHED" || data.status === "ALREADY_MATCHED") {
        const roomId = data.roomId;
        const bubbleFromServer = data.bubble || bubble;

        setIsDetailOpen(false);
        goToChat({
          bubble: bubbleFromServer,
          roomId,
          otherUser: null,
        });
      }
    } catch (err) {
      console.error("match bubble error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างห้องแชท");
    } finally {
      setIsMatching(false);
    }
  };

  // View switching

  if (view === "profile") {
    return <ProfilePage profile={profile} onBack={goHome} />;
  }

  if (view === "wallet") {
    return <WalletPage onBack={goHome} />;
  }

  if (view === "create") {
    return (
      <CreateBubblePage
        profile={profile}
        onBack={goHome}
        onCreated={(createdBubble) => {
          goToWaiting(createdBubble);
        }}
      />
    );
  }

  if (view === "waiting") {
    return (
      <WaitingForSolverPage
        bubble={currentBubble}
        onBack={() => {
          setCurrentBubble(null);
          goHome();
        }}
        onMatched={handleRequesterMatched}
      />
    );
  }

  // if (view === "chat") {
  //   return (
  //     <ChatPage
  //       profile={profile}
  //       roomId={currentRoomId}
  //       bubble={currentBubble}
  //       otherUser={currentOtherUser}
  //       role={role}
  //       onBack={goHomeAndResetSession}
  //     />
  //   );
  // }
  if (view === "chat") {
    return (
      <ChatPage
        profile={profile}
        roomId={currentRoomId}
        bubble={currentBubble}
        otherUser={currentOtherUser}
        role={role} // หรือ "solver" ตาม logic คุณ
        onBack={() => {
          setView("home");
          setCurrentRoomId(null);
          setCurrentBubble(null);
          setCurrentOtherUser(null);
        }}
        onGoToTip={({ matchId, bubble, solver, requesterId }) => {
          setTipContext({ matchId, bubble, solver, requesterId });
          setView("tip");
        }}
      />
    );
  }

  if (view === "tip") {
    return (
      <TipPage
        profile={profile}
        tipContext={tipContext}
        onBackHome={() => {
          setView("home");
          setCurrentRoomId(null);
          setCurrentBubble(null);
          setCurrentOtherUser(null);
          setTipContext(null);
        }}
      />
    );
  }

  // Home view

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

              {/* สวิตช์เปิด/ปิดรอเคส */}
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
              กำลังดึงตำแหน่งของคุณ…
            </div>
          )}

          {role === "solver" && geoError && (
            <div className="mt-1 text-[11px] text-red-500">
              ไม่สามารถดึงตำแหน่งของคุณได้: {geoError}
            </div>
          )}

          <p className="mt-1 text-[11px] text-slate-500">
            {role === "solver"
              ? "กำลังแสดงปัญหาที่อยู่ใกล้คุณ (ประมาณ 50 เมตร)"
              : "กำลังแสดงปัญหาที่ถูกสร้างในระบบ"}
          </p>

          <BubbleList
            items={filteredBubbles}
            isLoading={isLoading}
            onItemClick={handleOpenBubbleDetail}
          />
        </main>

        <FooterNav
          onPlusClick={goToCreate}
          onProfileClick={goToProfile}
          onWalletClick={goToWallet}
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
