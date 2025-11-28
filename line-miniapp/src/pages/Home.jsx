import "../App.css";
import React, { useState, useEffect } from "react";

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

function formatBubbleData(raw) {
  const maxTitleLen = 40;
  const maxDescLen = 80;

  let title = raw.title || "";
  if (title.length > maxTitleLen) {
    title = title.slice(0, maxTitleLen - 1) + "…";
  }

  let description = raw.description || "";
  if (description.length > maxDescLen) {
    description = description.slice(0, maxDescLen - 1) + "…";
  }

  let expiresAtMs = null;

  if (raw.expiresAt) {
    if (raw.expiresAt._seconds != null) {
      expiresAtMs =
        raw.expiresAt._seconds * 1000 +
        Math.floor((raw.expiresAt._nanoseconds || 0) / 1e6);
    } else {
      const d = new Date(raw.expiresAt);
      if (!isNaN(d.getTime())) {
        expiresAtMs = d.getTime();
      }
    }
  } else if (raw.created_at && raw.expiresInMinutes != null) {
    let createdMs = null;

    if (raw.created_at._seconds != null) {
      createdMs =
        raw.created_at._seconds * 1000 +
        Math.floor((raw.created_at._nanoseconds || 0) / 1e6);
    } else {
      const d = new Date(raw.created_at);
      if (!isNaN(d.getTime())) {
        createdMs = d.getTime();
      }
    }

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
    priority: raw.priority || raw.status || "OPEN",
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
  const [bubbles, setBubbles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchText, setSearchText] = useState("");

  // view: "home" | "profile" | "wallet" | "create" | "waiting" | "chat"
  const [view, setView] = useState(initialRoom ? "chat" : "home");

  const [currentBubble, setCurrentBubble] = useState(
    initialRoom?.bubble || null
  );
  const [currentRoomId, setCurrentRoomId] = useState(
    initialRoom?.roomId || null
  );
  const [currentOtherUser, setCurrentOtherUser] = useState(
    initialRoom?.otherUser || null
  );

  const [selectedBubble, setSelectedBubble] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    console.log(" initialRoom changed to:", initialRoom);
  }, [initialRoom]);

  useEffect(() => {
    if (role !== "requester") return;

    let isCancelled = false;
    let intervalId = null;

    async function fetchBubblesForRequester() {
      try {
        if (isCancelled) return;

        setIsLoading(true);
        setErrorMsg("");

        const res = await fetch(`${API_BASE}/api/bubbles/list`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "โหลด bubble ไม่สำเร็จ");
        }

        const data = await res.json();
        console.log("[Requester] raw bubbles:", data);
        const formatted = (data || []).map(formatBubbleData);

        if (!isCancelled) {
          setBubbles(formatted);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลด bubble");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchBubblesForRequester();
    intervalId = setInterval(fetchBubblesForRequester, 10_000);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [role, profile?.userId, API_BASE]);

  useEffect(() => {
    if (role !== "solver") return;
    if (!geo) return;

    let isCancelled = false;
    let intervalId = null;

    async function fetchBubblesForSolver() {
      try {
        if (isCancelled) return;

        setIsLoading(true);
        setErrorMsg("");

        const params = new URLSearchParams({
          lat: String(geo.lat),
          lon: String(geo.lon),
          radiusMeters: String(70),
        });

        const url = `${API_BASE}/api/bubbles/nearby?${params.toString()}`;
        console.log("[fetchBubblesForSolver] URL =", url);

        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "โหลด bubble ใกล้คุณไม่สำเร็จ");
        }

        const data = await res.json();
        console.log("[Solver] raw nearby bubbles:", data);

        const formatted = (data || []).map(formatBubbleData);
        console.log("[Solver] formatted nearby:", formatted);

        if (!isCancelled) {
          setBubbles(formatted);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลด bubble ใกล้คุณ");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchBubblesForSolver();
    intervalId = setInterval(fetchBubblesForSolver, 10_000);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [role, geo, API_BASE]);

  async function fetchUserProfile(userId, API_BASE) {
    if (!userId) return null;

    try {
      const res = await fetch(`${API_BASE}/api/users/profile/${userId}`);
      if (res.ok) {
        const profile = await res.json();
        return {
          userId: profile.userId || userId,
          name: profile.displayName || "Requester",
          pictureUrl: profile.pictureUrl || null,
        };
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }

    // Fallback profile
    return { userId, name: "Requester", pictureUrl: null };
  }

  const filteredBubbles = bubbles.filter((b) => {
    if (b.expiresAtMs && b.expiresAtMs <= Date.now()) {
      return false;
    }

    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  });

  const handleRequesterMatched = ({ bubble, roomId, solver }) => {
    console.log("RoomId from handleRequesterMatched : ", roomId);
    setCurrentBubble(bubble);
    setCurrentRoomId(roomId);
    setCurrentOtherUser(solver || null);
    setView("chat");
  };

  const handleOpenBubbleDetail = (bubble) => {
    setSelectedBubble(bubble);
    setIsDetailOpen(true);
  };

  const handleCloseBubbleDetail = () => {
    setIsDetailOpen(false);
    setSelectedBubble(null);
  };

  // solver กด "Match" จากหน้า bubble detail → สร้าง room แล้วเข้า chat ด้วย roomId
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
      console.log("solver-accept result:", data);

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
        setCurrentBubble(data.bubble || bubble);
        setCurrentRoomId(roomId);
        setCurrentOtherUser(null);
        setIsDetailOpen(false);
        setView("chat");
      }
    } catch (err) {
      console.error("match bubble error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างห้องแชท");
    } finally {
      setIsMatching(false);
    }
  };

  if (view === "profile") {
    console.log("view : ", view);
    return <ProfilePage profile={profile} onBack={() => setView("home")} />;
  }

  if (view === "wallet") {
    return <WalletPage onBack={() => setView("home")} />;
  }

  if (view === "create") {
    console.log("view : ", view);
    return (
      <CreateBubblePage
        profile={profile}
        onBack={() => setView("home")}
        onCreated={(createdBubble) => {
          setCurrentBubble(createdBubble);
          setView("waiting");
        }}
      />
    );
  }

  if (view === "waiting") {
    console.log("view : ", view);
    console.log("currentRoomId : ", currentRoomId);
    return (
      <WaitingForSolverPage
        bubble={currentBubble}
        onBack={() => {
          setCurrentBubble(null);
          setView("home");
        }}
        onMatched={handleRequesterMatched}
      />
    );
  }

  if (view === "chat") {
    console.log("view : ", view);
    console.log("currentRoomId : ", currentRoomId);
    return (
      <ChatPage
        profile={profile}
        roomId={currentRoomId}
        bubble={currentBubble}
        otherUser={currentOtherUser}
        role={role}
        onBack={() => {
          setView("home");
          setCurrentRoomId(null);
          setCurrentBubble(null);
          setCurrentOtherUser(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        <Header />

        <main className="flex-1 px-4 pt-2 pb-24">
          <SearchBar value={searchText} onChange={setSearchText} />

          {role === "solver" && (
            <div className="mb-3">
              <DailyQuestAccordion
                lineId={profile?.userId}
                className="text-[12px]"
              />
            </div>
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
              ? "กำลังแสดงปัญหาที่อยู่ใกล้คุณ (ประมาณ 20 เมตร)"
              : "กำลังแสดงปัญหาที่ถูกสร้างในระบบ"}
          </p>

          <BubbleList
            items={filteredBubbles}
            isLoading={isLoading}
            onItemClick={handleOpenBubbleDetail}
          />
        </main>

        <FooterNav
          onPlusClick={() => setView("create")}
          onProfileClick={() => setView("profile")}
          onWalletClick={() => setView("wallet")}
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
