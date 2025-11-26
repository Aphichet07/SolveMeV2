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


  return {
    id: raw.id,
    title,
    description,
    profile: raw.requesterId || "Anonymous",
    distanceText: null,
    priority: raw.status || "OPEN",
    raw, 
  };
}

function HomePage({
  profile,
  idToken,
  role,
  initialRoom,
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
  const [currentOtherUser, setCurrentOtherUser] = useState(null);

  const [selectedBubble, setSelectedBubble] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
  if (role !== "requester") return;

  let isCancelled = false;
  let intervalId = null;

  async function fetchBubblesForRequester() {
    try {
      if (isCancelled) return;

      setIsLoading(true);
      setErrorMsg("");

      const params = new URLSearchParams();
      if (profile?.userId) {
        params.set("userId", profile.userId);
      }

      const res = await fetch(
        `${API_BASE}/api/bubbles/list?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "โหลด bubble ไม่สำเร็จ");
      }

      const data = await res.json();
      console.log("-------------------- : ", data)
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
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [role, profile?.userId, API_BASE]);

//  auto refresh
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
        radiusMeters: "20",
      });

      const res = await fetch(
        `${API_BASE}/api/bubbles/nearby?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "โหลด bubble ใกล้คุณไม่สำเร็จ");
      }

      const data = await res.json();
      const formatted = (data || []).map(formatBubbleData);

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

  // ดึงครั้งแรกทันที
  fetchBubblesForSolver();

  // จากนั้น refresh ทุก 10 วินาที
  intervalId = setInterval(fetchBubblesForSolver, 10_000);

  return () => {
    isCancelled = true;
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [role, geo, API_BASE]);

  const filteredBubbles = bubbles.filter((b) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  });

  const handleRequesterMatched = ({ bubble, matchId, solver }) => {
    setCurrentBubble(bubble);
    setCurrentRoomId(matchId);
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

  const handleMatchBubble = async (bubble) => {
    if (!bubble || !profile?.userId) return;
    if (role !== "solver") {
      return;
    }

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
        setCurrentBubble(data.bubble || bubble);
        setCurrentRoomId(data.roomId);
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
    return (
      <ProfilePage
        profile={profile}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "wallet") {
    return <WalletPage onBack={() => setView("home")} />;
  }

  if (view === "create") {
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
    return (
      <ChatPage
        profile={profile}
        matchId={currentRoomId}
        bubble={currentBubble}
        otherUser={currentOtherUser}
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






// import "../App.css";
// import React, { useState, useEffect } from "react";

// import FooterNav from "../components/footer";
// import Header from "../components/header";
// import SearchBar from "../components/searchbar";
// import BubbleList from "../components/bubblelist";
// import CreateBubblePage from "./createBubble";
// import ProfilePage from "./profile.jsx";
// import WalletPage from "./wallet.jsx";
// import WaitingForSolverPage from "./waiting.jsx";
// import ChatPage from "./chat.jsx"

// function formatBubbleData(raw) {
//   const maxTitleLen = 40;
//   const maxDescLen = 80;

//   let title = raw.title || "";
//   if (title.length > maxTitleLen) {
//     title = title.slice(0, maxTitleLen - 1) + "…";
//   }

//   let description = raw.description || "";
//   if (description.length > maxDescLen) {
//     description = description.slice(0, maxDescLen - 1) + "…";
//   }

//   return {
//     id: raw.id,
//     title,
//     description,
//     profile: raw.requesterId || "Anonymous",
//     distanceText: null,
//     priority: raw.status || "OPEN",
//   };
// }

// function HomePage({ profile, idToken, role, initialRoom }) {
//   const [bubbles, setBubbles] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [searchText, setSearchText] = useState("");

//   const [view, setView] = useState("home"); // "home" | "profile" | "wallet" | "create" | "waiting" | "chat"
//   const [currentBubble, setCurrentBubble] = useState(null);
//   const [currentRoomId, setCurrentRoomId] = useState(initialRoom?.roomId || null);
//   const [currentChat, setCurrentChat] = useState(null);
//   const [selectedBubble, setSelectedBubble] = useState(null);
//   const [isDetailOpen, setIsDetailOpen] = useState(false);
//   const [isMatching, setIsMatching] = useState(false);


//   const [geo, setGeo] = useState(null);


//   useEffect(() => {
//     // if (role !== "solver") return;
//     if (!navigator.geolocation) {
//       setErrorMsg("อุปกรณ์นี้ไม่รองรับการใช้ตำแหน่งที่ตั้ง");
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         setGeo({
//           lat: pos.coords.latitude,
//           lon: pos.coords.longitude,
//         });
//       },
//       (err) => {
//         console.warn("Geo error:", err);
//         setErrorMsg("ไม่สามารถดึงตำแหน่งจากอุปกรณ์ได้");
//       }
//     );
//   }, [role]);

//   useEffect(() => {
//     async function fetchBubblesForRequester() {
//       try {
//         setIsLoading(true);
//         setErrorMsg("");

//         const params = new URLSearchParams();
//         if (profile?.userId) {
//           params.set("userId", profile.userId);
//         }
 
//         const res = await fetch(
//           `${import.meta.env.VITE_API_BASE_URL}/api/bubbles/list?${params.toString()}`,
//           {
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (!res.ok) {
//           const data = await res.json().catch(() => ({}));
//           throw new Error(data.message || "โหลด bubble ไม่สำเร็จ");
//         }

//         const data = await res.json();
//         const formatted = (data || []).map(formatBubbleData);
//         setBubbles(formatted);
//       } catch (err) {
//         console.error(err);
//         setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลด bubble");
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     async function fetchBubblesForSolver() {
//       if (!geo) return;

//       try {
//         setIsLoading(true);
//         setErrorMsg("");

//         const params = new URLSearchParams({
//           lat: String(geo.lat),
//           lon: String(geo.lon),
//           radiusMeters: "20",
//         });

//         const res = await fetch(
//           `${import.meta.env.VITE_API_BASE_URL}/api/bubbles/nearby?${params.toString()}`,
//           {
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (!res.ok) {
//           const data = await res.json().catch(() => ({}));
//           throw new Error(data.message || "โหลด bubble ใกล้คุณไม่สำเร็จ");
//         }

//         const data = await res.json();
//         const formatted = (data || []).map(formatBubbleData);
//         setBubbles(formatted);
//       } catch (err) {
//         console.error(err);
//         setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลด bubble ใกล้คุณ");
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     if (role === "solver") {
//       if (geo) {
//         fetchBubblesForSolver();
//       }
//     } else {
//       fetchBubblesForRequester();
//     }
//   }, [role, profile?.userId, geo]);

//   const filteredBubbles = bubbles.filter((b) => {
//     if (!searchText.trim()) return true;
//     const q = searchText.toLowerCase();
//     return (
//       b.title.toLowerCase().includes(q) ||
//       b.description.toLowerCase().includes(q)
//     );
//   });


//   const handleMatched = ({ bubble, matchId, solver }) => {
//     setCurrentChat({
//       bubble,
//       matchId,
//       solver,
//     });
//     setView("chat");
//   };

//   const handleRequesterMatched = ({ bubble, matchId, solver }) => {
//     setCurrentBubble(bubble);
//     setCurrentRoomId(matchId);
//     setView("chat");
//   };


//   if (view === "profile") {
//     return (
//       <ProfilePage
//         profile={profile}
//         onBack={() => setView("home")}
//       />
//     );
//   }

//   if (view === "wallet") {
//     return <WalletPage onBack={() => setView("home")} />;
//   }

//   if (view === "create") {
//     return (
//       <CreateBubblePage
//         profile={profile}
//         onBack={() => setView("home")}
//         onCreated={(createdBubble) => {
//           setCurrentBubble(createdBubble);
//           setView("waiting");
//         }}
//       />
//     );
//   }

//   if (view === "waiting") {
//     return (
//       <WaitingForSolverPage
//         bubble={currentBubble}
//         onBack={() => {
//           setCurrentBubble(null);
//           setView("home");
//         }}
//         onMatched={handleRequesterMatched}
//       />
//     );
//   }

//   if (view === "chat") {
//     return (
//       <ChatPage
//         profile={profile}
//         matchId={currentRoomId}
//         bubble={currentBubble}   // ฝั่ง solver อาจจะยังเป็น null ก็ได้ ChatPage handle ได้
//         otherUser={null}         // ตอนแรกยังไม่รู้ profile อีกฝั่ง ก็ส่ง null ไปก่อน
//         onBack={() => {
//           setView("home");
//           setCurrentRoomId(null);
//         }}
//       />
//     );
//   }


//   return (
//     <div className="min-h-screen bg-slate-50 flex justify-center">
//       <div className="w-full max-w-md flex flex-col">
//         <Header />

//         <main className="flex-1 px-4 pt-2 pb-24">
//           <SearchBar value={searchText} onChange={setSearchText} />

//           {errorMsg && (
//             <div className="mt-2 text-[11px] text-red-500">{errorMsg}</div>
//           )}


//           <p className="mt-1 text-[11px] text-slate-500">
//             {role === "solver"
//               ? "กำลังแสดงปัญหาที่อยู่ใกล้คุณ (ประมาณ 20 เมตร)"
//               : "กำลังแสดงปัญหาที่ถูกสร้างในระบบ"}
//           </p>

//           <BubbleList items={filteredBubbles} isLoading={isLoading} />
//         </main>

//         <FooterNav
//           onPlusClick={() => setView("create")}
//           onProfileClick={() => setView("profile")}
//           onWalletClick={() => setView("wallet")}
//         />
//       </div>
//     </div>
//   );
// }

// export default HomePage;
