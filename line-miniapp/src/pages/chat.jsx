import React, { useEffect, useState, useRef } from "react";
import {
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getMessagesCollection } from "../models/chat_message.model.js";
import EndChatConfirmModal from "../components/EndChatConfirmModal.jsx";
import TipModal from "../components/TipModal.jsx";
import ImageUploadIcon from "../assets/imageUpload.png";
import CameraIcon from "../assets/photo-camera-interface-symbol-for-button.png";
import SolverReviewTipModal from "../components/SolverReviewModal.jsx";

export default function ChatPage({
  profile,
  roomId,
  bubble,
  otherUser,
  onBack,
  role,
}) {
  console.log("[ChatPage] props = ", {
    roomId,
    bubble,
    otherUser,
    role,
    profile,
  });

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endMode, setEndMode] = useState("CLOSED");

  const [showTipModal, setShowTipModal] = useState(false);
  const [tipSubmitting, setTipSubmitting] = useState(false);
  const [tipContext, setTipContext] = useState(null); // { matchId, bubbleId, solverId }

  const [roomClosedNotice, setRoomClosedNotice] = useState(null);

  const [showSolverReviewModal, setShowSolverReviewModal] = useState(false);
  const [solverReviewSubmitting, setSolverReviewSubmitting] = useState(false);

  const listRef = useRef(null);
  const userId = profile?.userId;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  // =========================
  // subscribe ข้อความในห้อง (messages) อย่างเดียว
  // ตาม rule: /rooms/{roomId}/messages/{messageId}
  // =========================
  useEffect(() => {
    if (!roomId) {
      console.warn("[ChatPage] no roomId, skip subscribe");
      return;
    }

    const colRef = getMessagesCollection(roomId);
    const q = query(colRef, orderBy("created_at", "asc"));

    console.log(
      "[ChatPage] Subscribing messages roomId =",
      roomId,
      "path =",
      colRef.path
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setMessages(items);

        // auto scroll ลงล่างสุด
        if (listRef.current) {
          setTimeout(() => {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }, 0);
        }

        const hasClosed = items.some(
          (m) => m.type === "SYSTEM" && m.kind === "ROOM_CLOSED"
        );
        if (hasClosed) {
          alert("การสนทนานี้สิ้นสุดลงแล้ว");
          onBack && onBack();
        }
      },
      (error) => {
        console.error("[ChatPage] onSnapshot error:", error);
      }
    );

    return () => {
      console.log("[ChatPage] unsubscribe roomId =", roomId);
      unsub();
    };
  }, [roomId, onBack]);

  // ส่งข้อความปกติ
  const handleSend = async (e) => {
    e?.preventDefault();

    if (!roomId || !userId) {
      console.warn("[Chat] missing roomId or userId", { roomId, userId });
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      const colRef = getMessagesCollection(roomId);

      await addDoc(colRef, {
        chat_room_id: roomId,
        sender_id: userId,
        message: trimmed,
        created_at: serverTimestamp(),
      });

      setText("");
    } catch (err) {
      console.error("send message error:", err);
    } finally {
      setSending(false);
    }
  };

  // Quick Messages
  const sendQuickMessage = async (messageText) => {
    if (!roomId || !userId) {
      console.warn("[QuickMessage] missing roomId or userId", {
        roomId,
        userId,
      });
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      const colRef = getMessagesCollection(roomId);

      await addDoc(colRef, {
        chat_room_id: roomId,
        sender_id: userId,
        message: trimmed,
        created_at: serverTimestamp(),
      });
    } catch (err) {
      console.error("send quick message error:", err);
    } finally {
      setSending(false);
    }
  };

  const renderTitle = () => {
    if (otherUser?.name) {
      return `แชทของ ${otherUser.name}`;
    }
    return "ห้องแชท";
  };

  const formatTime = (ts) => {
    try {
      if (!ts) return "";
      const d = ts.toDate ? ts.toDate() : ts;
      return d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };



  const handleEndChat = async () => {
    try {
      if (roomId && userId) {
        await fetch(`${API_BASE}/api/chat/exit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            match_id: roomId,
            user_id: userId,
            role, // "requester" | "solver"
          }),
        }).catch((err) => {
          console.error("chat exit api error:", err);
        });
      }
    } catch (err) {
      console.error("handleEndChat error:", err);
    } finally {
      setShowEndConfirm(false);
      onBack && onBack();
    }
  };

  const handleCompleteChat = async () => {
    if (role !== "requester") {
      await handleEndChat();
      return;
    }

    try {
      const solverId =
        otherUser?.userId ||
        otherUser?.id ||
        otherUser?.uid ||
        otherUser?.lineId ||
        null;

      if (!roomId || !userId || !solverId) {
        console.warn("Missing ids for complete chat:", {
          roomId,
          requesterId: userId,
          solverId,
        });
        await handleEndChat();
        return;
      }

      await fetch(`${API_BASE}/api/chat/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: roomId,
          bubble_id: bubble?.id || bubble?.bubble_id || bubble?._id || null,
          requester_id: userId,
          solver_id: solverId,
        }),
      }).catch((err) => {
        console.error("complete chat api error:", err);
      });

      // เดิมใช้ TipModal ถ้าจะยังใช้ ก็เปิดตรงนี้
      setTipContext({
        matchId: roomId,
        bubbleId: bubble?.id || bubble?.bubble_id || bubble?._id || null,
        solverId,
      });
      setShowTipModal(true);
    } catch (err) {
      console.error("handleCompleteChat error:", err);
      await handleEndChat();
    }
  };

  const handleEndConfirm = async () => {
    if (endMode === "complete") {
      await handleCompleteChat();
    } else {
      await handleEndChat();
    }
  };
  const handleSolverReviewSubmit = async ({ rating, comment }) => {
    // solver คือ user ปัจจุบัน
    const solverId = userId;
    // requester คือฝั่งตรงข้ามในห้อง
    const requesterId =
      otherUser?.userId || otherUser?.id || otherUser?.lineId || null;

    if (!roomId || !solverId || !requesterId) {
      console.warn("[SolverReview] missing ids", {
        roomId,
        solverId,
        requesterId,
      });
      setShowSolverReviewModal(false);
      await handleEndChat();
      return;
    }

    try {
      setSolverReviewSubmitting(true);

      // 1) ส่งรีวิวเข้า backend
      // TODO: สร้าง endpoint /api/review/send หรือชื่อที่คุณกำหนดเอง
      await fetch(`${API_BASE}/api/review/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: roomId,
          from_user_id: solverId,
          to_user_id: requesterId,
          rating,
          comment,
          role: "solver",
        }),
      }).catch((err) => {
        console.error("[SolverReview] api error:", err);
      });

      // 2) ปิด modal และออกจากห้อง
      setShowSolverReviewModal(false);
      await handleEndChat();
    } catch (err) {
      console.error("[SolverReview] submit error:", err);
      setShowSolverReviewModal(false);
      await handleEndChat();
    } finally {
      setSolverReviewSubmitting(false);
    }
  };

  const handleTipSubmit = async (amount) => {
    if (!tipContext || !userId) {
      setShowTipModal(false);
      await handleEndChat();
      return;
    }

    try {
      setTipSubmitting(true);
      const payload = {
        match_id: tipContext.matchId,
        bubble_id: tipContext.bubbleId,
        from_user_id: userId,
        to_user_id: tipContext.solverId,
        amount: Number(amount),
      };

      const res = await fetch(`${API_BASE}/api/tip/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[TIP] send failed:", data);
      } else {
        const data = await res.json().catch(() => ({}));
        console.log("[TIP] send success:", data);
      }
    } catch (err) {
      console.error("[TIP] send error:", err);
    } finally {
      setTipSubmitting(false);
      setShowTipModal(false);
      await handleEndChat();
    }
  };

  const handleTipSkip = async () => {
    setShowTipModal(false);
    await handleEndChat();
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="h-screen bg-white flex flex-col relative">
      {/* Header */}
      <header className="pt-2 pb-1 px-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => {
              setEndMode("CLOSED");
              setShowEndConfirm(true);
            }}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm"
          >
            ←
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {renderTitle()}
            </span>
            {bubble?.title && (
              <span className="text-[10px] text-slate-500 truncate max-w-[220px]">
                {bubble.title}
              </span>
            )}
            {role === "requester" && (
              <button
                type="button"
                onClick={() => {
                  setEndMode("complete");
                  handleCompleteChat();
                }}
                className="
                  mt-1 px-3 h-7 rounded-full
                  bg-emerald-500 text-white text-[11px]
                  flex items-center justify-center
                  shadow-[0_1px_4px_rgba(16,185,129,0.4)]
                  active:scale-95
                "
              >
                เสร็จสิ้น
              </button>
            )}
            {role === "solver" && (
              <button
                type="button"
                onClick={() => {
                  // ไม่ต้องยิง completeChat ซ้ำ แค่เปิด modal รีวิว
                  setShowSolverReviewModal(true);
                }}
                className="
      mt-1 px-3 h-7 rounded-full
      bg-emerald-500 text-white text-[11px]
      flex items-center justify-center
      shadow-[0_1px_4px_rgba(16,185,129,0.4)]
      active:scale-95
    "
              >
                เสร็จสิ้น
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 flex flex-col bg-white">
        <div
          ref={listRef}
          className="flex-1 px-4 py-3 overflow-y-auto bg-white"
        >
          {messages.length === 0 && (
            <p className="text-[11px] text-center text-slate-400 mt-4">
              ยังไม่มีข้อความ เริ่มพิมพ์เพื่อคุยกันได้เลย
            </p>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((m) => {
              // ข้าม system message เวลา render bubble ปกติ (หรือจะแสดงเป็นข้อความระบบก็ได้)
              if (m.type === "SYSTEM") {
                return null;
              }

              const isMe = m.sender_id === userId;
              const time = formatTime(m.created_at);
              const avatarUrl = isMe
                ? profile?.pictureUrl
                : otherUser?.avatarUrl || otherUser?.pictureUrl;

              return (
                <div
                  key={m.id}
                  className={`flex w-full ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isMe && (
                    <div className="w-10 flex justify-center mr-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="avatar"
                          className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-300" />
                      )}
                    </div>
                  )}

                  <div className="max-w-[78%] flex flex-col">
                    <div
                      className={`
                        inline-block
                        rounded-2xl border border-slate-200 bg-white
                        px-3 py-2
                        shadow-[0_1px_3px_rgba(15,23,42,0.06)]
                        ${isMe ? "ml-auto" : "mr-auto"}
                      `}
                    >
                      <p className="text-[12px] text-slate-800 whitespace-pre-wrap wrap-break-word">
                        {m.message}
                      </p>
                    </div>

                    {time && (
                      <p
                        className={`mt-1 text-[10px] text-slate-400 ${
                          isMe ? "text-right" : "text-left"
                        }`}
                      >
                        {time}
                      </p>
                    )}
                  </div>

                  {isMe && (
                    <div className="w-10 flex justify-center ml-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="me"
                          className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* quick messages */}
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => sendQuickMessage("สวัสดีครับ/ค่ะ")}
            className="px-4 h-8 rounded-full bg-emerald-500 text-white text-[11px]"
          >
            สวัสดีครับ/ค่ะ
          </button>

          <button
            type="button"
            onClick={() => sendQuickMessage("ขอบคุณครับ/ค่ะ")}
            className="px-4 h-8 rounded-full bg-emerald-500 text-white text-[11px]"
          >
            ขอบคุณครับ/ค่ะ
          </button>

          <button
            type="button"
            onClick={() => sendQuickMessage("กำลังไป !")}
            className="px-4 h-8 rounded-full bg-emerald-500 text-white text-[11px]"
          >
            กำลังไป !
          </button>
        </div>

        {/* input bar */}
        <form
          onSubmit={handleSend}
          className="h-14 px-4 pb-4 bg-white flex items-center gap-2"
        >
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-xl text-slate-500"
          >
            <img src={CameraIcon} alt="CameraIcon" />
          </button>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-xl text-slate-500"
          >
            <img src={ImageUploadIcon} alt="ImageUploadIcon" />
          </button>

          <div className="flex-1 h-9 rounded-full border border-slate-200 bg-white flex items-center px-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="พิมพ์ข้อความ"
              className="flex-1 text-[13px] outline-none bg-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={sending || !text.trim()}
            className={`
              w-9 h-9 rounded-full flex items-center justify-center text-lg
              ${
                sending || !text.trim()
                  ? "bg-slate-200 text-slate-400"
                  : "bg-emerald-500 text-white active:scale-95"
              }
            `}
          >
            ➤
          </button>
        </form>
      </main>

      <EndChatConfirmModal
        open={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={handleEndConfirm}
      />

      <TipModal
        open={showTipModal && role === "requester"}
        loading={tipSubmitting}
        onClose={handleTipSkip}
        onSubmit={handleTipSubmit}
      />

      <SolverReviewTipModal
        open={showSolverReviewModal && role === "solver"}
        loading={solverReviewSubmitting}
        solverName={
          bubble?.title ? `ผู้ขอ: ${bubble.title}` : "ผู้ขอความช่วยเหลือ"
        }
        onClose={() => setShowSolverReviewModal(false)}
        onSubmit={handleSolverReviewSubmit}
      />
    </div>
  );
}

// import React, { useEffect, useRef, useState } from "react";
// import {
//   onSnapshot,
//   query,
//   orderBy,
//   addDoc,
//   serverTimestamp,
//   getDocs,
//   deleteDoc,
// } from "firebase/firestore";

// import { getMessagesCollection } from "../models/chat_message.model.js";
// import EndChatConfirmModal from "../components/EndChatConfirmModal.jsx";
// import ImageUploadIcon from "../assets/imageUpload.png";
// import CameraIcon from "../assets/photo-camera-interface-symbol-for-button.png";

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// export default function ChatPage({
//   profile,
//   roomId,
//   bubble,
//   otherUser,
//   onBack,
//   role,
// }) {
//   console.log("[ChatPage] props = ", {
//     roomId,
//     bubble,
//     otherUser,
//     role,
//     profile,
//   });

//   // State
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState("");
//   const [sending, setSending] = useState(false);

//   const [showEndConfirm, setShowEndConfirm] = useState(false);
//   const [endMode, setEndMode] = useState("exit"); // "exit" | "complete"

//   const listRef = useRef(null);
//   const userId = profile?.userId;

//   const [showTipModal, setShowTipModal] = useState(false);
//   const [tipSubmitting, setTipSubmitting] = useState(false);
//   const [tipContext, setTipContext] = useState(null);

//   // Firestore subscription
//   useEffect(() => {
//     if (!roomId) {
//       console.warn("[ChatPage] no roomId, skip subscribe");
//       return;
//     }

//     const colRef = getMessagesCollection(roomId);
//     const q = query(colRef, orderBy("created_at", "asc"));

//     console.log("[ChatPage] Subscribing messages roomId =", roomId, "path =", colRef.path);

//     const unsubscribe = onSnapshot(
//       q,
//       (snap) => {
//         console.log("[ChatPage] snapshot size =", snap.size);

//         const items = [];
//         snap.forEach((doc) => {
//           console.log("[ChatPage] doc =", doc.id, doc.data());
//           items.push({ id: doc.id, ...doc.data() });
//         });

//         setMessages(items);

//         // auto scroll to bottom
//         if (listRef.current) {
//           setTimeout(() => {
//             listRef.current.scrollTop = listRef.current.scrollHeight;
//           }, 0);
//         }
//       },
//       (error) => {
//         console.error("[ChatPage] onSnapshot error:", error);
//       }
//     );

//     return () => {
//       console.log("[ChatPage] unsubscribe roomId =", roomId);
//       unsubscribe();
//     };
//   }, [roomId]);

//   // Helpers
//   const renderTitle = () => {
//     if (otherUser?.name) {
//       return `แชทของ ${otherUser.name}`;
//     }
//     return "ห้องแชท";
//   };

//   const formatTime = (ts) => {
//     try {
//       if (!ts) return "";
//       const d = ts.toDate ? ts.toDate() : ts;
//       return d.toLocaleTimeString("th-TH", {
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     } catch {
//       return "";
//     }
//   };

//   const getAvatarUrl = (isMe) => {
//     if (isMe) {
//       return profile?.pictureUrl || null;
//     }
//     return otherUser?.avatarUrl || otherUser?.pictureUrl || null;
//   };

//   const getSolverId = () => {
//     return otherUser?.userId || otherUser?.id || otherUser?.uid || null;
//   };

//   const getBubbleIdForComplete = () => {
//     return bubble?.id || bubble?.bubble_id || bubble?._id || null;
//   };

//   // Message sending
//   const sendMessageToFirestore = async (messageText) => {
//     if (!roomId || !userId) {
//       console.warn("[Chat] missing roomId or userId", { roomId, userId });
//       return;
//     }

//     const trimmed = messageText.trim();
//     if (!trimmed) return;

//     try {
//       setSending(true);

//       const colRef = getMessagesCollection(roomId);
//       const payload = {
//         chat_room_id: roomId,
//         sender_id: userId,
//         message: trimmed,
//         created_at: serverTimestamp(),
//       };

//       console.log("[Chat] addDoc:", payload);
//       await addDoc(colRef, payload);
//     } catch (err) {
//       console.error("send message error:", err);
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleSend = async (e) => {
//     e?.preventDefault();

//     if (!text.trim()) return;

//     await sendMessageToFirestore(text);
//     setText("");
//   };

//   const sendQuickMessage = async (messageText) => {
//     await sendMessageToFirestore(messageText);
//   };

//   // End / complete chat
//   const handleEndChat = async () => {
//     try {
//       if (!roomId) return;

//       const colRef = getMessagesCollection(roomId);
//       const snap = await getDocs(colRef);

//       const deletions = snap.docs.map((doc) => deleteDoc(doc.ref));
//       await Promise.all(deletions);
//     } catch (err) {
//       console.error("delete chat error:", err);
//     } finally {
//       setShowEndConfirm(false);
//       onBack && onBack();
//     }
//   };

//   const handleCompleteChat = async () => {
//     // ถ้าไม่ใช่ requester → จบแค่ลบ message + back
//     if (role !== "requester") {
//       await handleEndChat();
//       return;
//     }

//     try {
//       const solverId = getSolverId();

//       if (!roomId || !userId || !solverId) {
//         console.warn("Missing ids for complete chat:", {
//           roomId,
//           requesterId: userId,
//           solverId,
//         });
//         await handleEndChat();
//         return;
//       }

//       const bubbleId = getBubbleIdForComplete();

//       await fetch(`${API_BASE}/api/chat/complete`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           match_id: roomId,
//           bubble_id: bubbleId,
//           requester_id: userId,
//           solver_id: solverId,
//         }),
//       }).catch((err) => {
//         console.error("complete chat api error:", err);
//       });
//     } catch (err) {
//       console.error("handleCompleteChat error:", err);
//     } finally {
//       await handleEndChat();
//     }
//   };

//   const handleEndConfirm = async () => {
//     if (endMode === "complete") {
//       await handleCompleteChat();
//     } else {
//       await handleEndChat();
//     }
//   };

//   // Render message bubble
//   const renderMessageItem = (m) => {
//     const isMe = m.sender_id === userId;
//     const time = formatTime(m.created_at);
//     const avatarUrl = getAvatarUrl(isMe);

//     return (
//       <div
//         key={m.id}
//         className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
//       >
//         {!isMe && (
//           <div className="w-10 flex justify-center mr-2">
//             {avatarUrl ? (
//               <img
//                 src={avatarUrl}
//                 alt="avatar"
//                 className="w-9 h-9 rounded-full border border-slate-200 object-cover"
//               />
//             ) : (
//               <div className="w-9 h-9 rounded-full bg-slate-300" />
//             )}
//           </div>
//         )}

//         <div className="max-w-[78%] flex flex-col">
//           <div
//             className={`
//               inline-block
//               rounded-2xl border border-slate-200 bg-white
//               px-3 py-2
//               shadow-[0_1px_3px_rgba(15,23,42,0.06)]
//               ${isMe ? "ml-auto" : "mr-auto"}
//             `}
//           >
//             <p className="text-[12px] text-slate-800 whitespace-pre-wrap wrap-break-word">
//               {m.message}
//             </p>
//           </div>

//           {time && (
//             <p
//               className={`
//                 mt-1 text-[10px] text-slate-400
//                 ${isMe ? "text-right" : "text-left"}
//               `}
//             >
//               {time}
//             </p>
//           )}
//         </div>

//         {isMe && (
//           <div className="w-10 flex justify-center ml-2">
//             {avatarUrl ? (
//               <img
//                 src={avatarUrl}
//                 alt="me"
//                 className="w-9 h-9 rounded-full border border-slate-200 object-cover"
//               />
//             ) : (
//               <div className="w-9 h-9 rounded-full bg-emerald-500" />
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Render
//   return (
//     <div className="h-screen bg-white flex flex-col relative">
//       {/* Header */}
//       <header className="pt-2 pb-1 px-4 border-b border-slate-100">
//         <div className="flex items-center gap-2 mb-1">
//           <button
//             type="button"
//             onClick={() => {
//               setEndMode("exit");
//               setShowEndConfirm(true);
//             }}
//             className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm"
//           >
//             ←
//           </button>

//           <div className="flex flex-col">
//             <span className="text-sm font-semibold text-slate-900">
//               {renderTitle()}
//             </span>

//             {bubble?.title && (
//               <span className="text-[10px] text-slate-500 truncate max-w-[220px]">
//                 {bubble.title}
//               </span>
//             )}

//             {role === "requester" && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   setEndMode("complete");
//                   setShowEndConfirm(true);
//                 }}
//                 className="
//                   mt-1 px-3 h-7 rounded-full
//                   bg-emerald-500 text-white text-[11px]
//                   flex items-center justify-center
//                   shadow-[0_1px_4px_rgba(16,185,129,0.4)]
//                   active:scale-95
//                 "
//               >
//                 เสร็จสิ้น
//               </button>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Messages */}
//       <main className="flex-1 flex flex-col bg-white">
//         <div
//           ref={listRef}
//           className="flex-1 px-4 py-3 overflow-y-auto bg-white"
//         >
//           {messages.length === 0 && (
//             <p className="text-[11px] text-center text-slate-400 mt-4">
//               ยังไม่มีข้อความ เริ่มพิมพ์เพื่อคุยกันได้เลย
//             </p>
//           )}

//           <div className="flex flex-col gap-4">
//             {messages.map((m) => renderMessageItem(m))}
//           </div>
//         </div>

//         {/* Quick messages */}
//         <div className="px-4 pb-2 flex flex-wrap gap-2">
//           <button
//             type="button"
//             onClick={() => sendQuickMessage("สวัสดีครับ/ค่ะ")}
//             className="px-4 h-8 rounded-full bg-emerald-500 text-white text-[11px]"
//           >
//             สวัสดีครับ/ค่ะ
//           </button>

//           <button
//             type="button"
//             onClick={() => sendQuickMessage("ขอบคุณครับ/ค่ะ")}
//             className="px-4 h-8 rounded-full bg-emerald-500 text-white text-[11px]"
//           >
//             ขอบคุณครับ/ค่ะ
//           </button>

//           <button
//             type="button"
//             onClick={() => sendQuickMessage("กำลังไป !")}
//             className="px-4 h-8 rounded-full bg-emerald-500 text-white text-[11px]"
//           >
//             กำลังไป !
//           </button>
//         </div>

//         {/* Input bar */}
//         <form
//           onSubmit={handleSend}
//           className="h-14 px-4 pb-4 bg-white flex items-center gap-2"
//         >
//           <button
//             type="button"
//             className="w-8 h-8 flex items-center justify-center text-xl text-slate-500"
//           >
//             <img src={CameraIcon} alt="CameraIcon" />
//           </button>

//           <button
//             type="button"
//             className="w-8 h-8 flex items-center justify-center text-xl text-slate-500"
//           >
//             <img src={ImageUploadIcon} alt="ImageUploadIcon" />
//           </button>

//           <div className="flex-1 h-9 rounded-full border border-slate-200 bg-white flex items-center px-3">
//             <input
//               type="text"
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               placeholder="พิมพ์ข้อความ"
//               className="flex-1 text-[13px] outline-none bg-transparent"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={sending || !text.trim()}
//             className={`
//               w-9 h-9 rounded-full flex items-center justify-center text-lg
//               ${
//                 sending || !text.trim()
//                   ? "bg-slate-200 text-slate-400"
//                   : "bg-emerald-500 text-white active:scale-95"
//               }
//             `}
//           >
//             ➤
//           </button>
//         </form>
//       </main>

//       {/* End chat modal */}
//       <EndChatConfirmModal
//         open={showEndConfirm}
//         onCancel={() => setShowEndConfirm(false)}
//         onConfirm={handleEndConfirm}
//       />
//     </div>
//   );
// }
