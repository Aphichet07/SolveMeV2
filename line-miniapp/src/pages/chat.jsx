import React, { useEffect, useState, useRef } from "react";
import {
    onSnapshot,
    query,
    orderBy,
    addDoc,
    serverTimestamp,
    getDocs,
    deleteDoc,
} from "firebase/firestore";
import { getMessagesCollection } from "../models/chat_message.model.js";
import EndChatConfirmModal from "../components/EndChatConfirmModal.jsx";
import ImageUploadIcon from "../assets/imageUpload.png"
import CameraIcon from "../assets/photo-camera-interface-symbol-for-button.png"


export default function ChatPage({ profile, matchId, bubble, otherUser, onBack, role }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    const listRef = useRef(null);
    const userId = profile?.userId;
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

    useEffect(() => {
        if (!matchId) return;

        const colRef = getMessagesCollection(matchId);
        const q = query(colRef, orderBy("create_at", "asc"));

        const unsub = onSnapshot(q, (snap) => {
            const items = [];
            snap.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setMessages(items);

            if (listRef.current) {
                setTimeout(() => {
                    listRef.current.scrollTop = listRef.current.scrollHeight;
                }, 0);
            }
        });

        return () => unsub();
    }, [matchId]);

    // ส่งข้อความปกติ
    const handleSend = async (e) => {
        e?.preventDefault();

        if (!matchId || !userId) return;
        const trimmed = text.trim();
        if (!trimmed) return;

        try {
            setSending(true);
            const colRef = getMessagesCollection(matchId);

            await addDoc(colRef, {
                chat_room_id: matchId,
                sender_id: userId,
                message: trimmed,
                create_at: serverTimestamp(),
            });

            setText("");
        } catch (err) {
            console.error("send message error:", err);
        } finally {
            setSending(false);
        }
    };

    // quick reply
    const sendQuickMessage = async (messageText) => {
        if (!matchId || !userId) return;
        const trimmed = messageText.trim();
        if (!trimmed) return;

        try {
            setSending(true);
            const colRef = getMessagesCollection(matchId);

            await addDoc(colRef, {
                chat_room_id: matchId,
                sender_id: userId,
                message: trimmed,
                create_at: serverTimestamp(),
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

    // จบแชท: ลบข้อความของห้องนี้
    const handleEndChat = async () => {
        try {
            if (!matchId) return;

            const colRef = getMessagesCollection(matchId);
            const snap = await getDocs(colRef);

            const deletions = snap.docs.map((doc) => deleteDoc(doc.ref));
            await Promise.all(deletions);
        } catch (err) {
            console.error("delete chat error:", err);
        } finally {
            setShowEndConfirm(false);
            onBack && onBack();
        }
    };

    return (
        <div className="h-screen bg-white flex flex-col relative">
            {/* Header */}
            <header className="pt-2 pb-1 px-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                    <button
                        onClick={() => setShowEndConfirm(true)}
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
                    </div>
                </div>
            </header>

            {/* พื้นที่ข้อความ */}
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
                            const isMe = m.sender_id === userId;
                            const time = formatTime(m.create_at);
                            const avatarUrl = isMe
                                ? profile?.pictureUrl
                                : otherUser?.avatarUrl || otherUser?.pictureUrl;

                            return (
                                <div
                                    key={m.id}
                                    className={`flex w-full ${isMe ? "justify-end" : "justify-start"
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
                                                className={`mt-1 text-[10px] text-slate-400 ${isMe ? "text-right" : "text-left"
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

                {/* quick reply */}
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

                {/* แถบพิมพ์ข้อความด้านล่าง */}
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
              ${sending || !text.trim()
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
                onConfirm={handleEndChat}
            />
        </div>
    );
}
