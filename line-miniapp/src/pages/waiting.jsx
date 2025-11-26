
import React, { useEffect, useState } from "react";

export default function WaitingForSolverPage({ bubble, onBack, onMatched }) {
    const [status, setStatus] = useState("searching"); // "searching" | "matched" | "timeout" | "error"
    const [matchedSolver, setMatchedSolver] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [activeSolvers, setActiveSolvers] = useState([]);
    const [radarSolvers, setRadarSolvers] = useState([]);

    const [matchId, setMatchId] = useState(null);
    const [showJoinPopup, setShowJoinPopup] = useState(false);
    const [hasRequestedMatch, setHasRequestedMatch] = useState(false);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
    console.log("waiting :", bubble)
    useEffect(() => {
        if (!bubble?.id) return;
        if (hasRequestedMatch) return;

        async function requestMatch() {
            try {
                const res = await fetch(`${API_BASE}/api/match/find-solver`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bubbleId: bubble.id }),
                });

                const data = await res.json();
                console.log("find-solver result:", data);

                if (data.status === "MATCHED" || data.status === "ALREADY_MATCHED") {
                    setStatus("matched");
                    setMatchId(data.roomId || data.matchId || null);

                    // เก็บ solver แบบง่าย ๆ ไว้เป็น otherUser
                    setMatchedSolver({
                        lineId: data.solverId,
                        name: "Solver",   // ถ้าอยากสวยให้ไปยิง API ขอ profile เพิ่ม
                    });

                    setShowJoinPopup(true);
                }
            } catch (err) {
                console.error("requestMatch error:", err);
                setErrorMsg("ไม่สามารถเริ่มจับคู่ได้");
                setStatus("error");
            } finally {
                setHasRequestedMatch(true);
            }
        }

        requestMatch();
    }, [bubble?.id, API_BASE, hasRequestedMatch]);

    useEffect(() => {
        if (!bubble?.id) return;

        async function fetchActiveSolvers() {
            try {
                const res = await fetch(
                    `${API_BASE}/api/bubbles/solvers/active?bubbleId=${bubble.id}`
                );
                console.log("Resssssss : ", res)
                if (!res.ok) {
                    throw new Error("โหลดรายชื่อ Solver ไม่สำเร็จ");
                }

                const data = await res.json();
                const normalized = (data || []).map((s) => ({
                    id: s.id || s.solverId,
                    name: s.name || s.display_name || "Solver",
                    avatarUrl: s.avatarUrl || s.avatar_url || null,
                }));
                setActiveSolvers(normalized);
            } catch (err) {
                console.error("fetchActiveSolvers error:", err);
            }
        }

        fetchActiveSolvers();
    }, [bubble?.id, API_BASE]);

    useEffect(() => {
        if (status !== "searching" || activeSolvers.length === 0) {
            setRadarSolvers([]);
            return;
        }

        const interval = setInterval(() => {
            const newPositions = activeSolvers.map((s, idx) => {
                const baseAngle = (idx / activeSolvers.length) * Math.PI * 2;
                const jitter = (Math.random() - 0.5) * (Math.PI / 8);
                const angle = baseAngle + jitter;

                const radius = 35 + Math.random() * 55; // ระยะห่างจาก center
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return {
                    ...s,
                    x,
                    y,
                };
            });

            setRadarSolvers(newPositions);
        }, 900);

        return () => clearInterval(interval);
    }, [status, activeSolvers]);

    const title = bubble?.title || "ปัญหาของคุณ";
    const description = bubble?.description || "";

    const renderStatusText = () => {
        switch (status) {
            case "searching":
                return "กำลังค้นหา Solver ให้คุณ . . .";
            case "matched":
                return matchedSolver
                    ? `พบ Solver: ${matchedSolver.name || "Solver"} แล้ว!`
                    : "พบ Solver แล้ว!";
            case "timeout":
                return "ยังไม่พบ Solver ที่พร้อมช่วยในเวลานี้";
            case "error":
                return "เกิดข้อผิดพลาดในการเช็คสถานะ matching";
            default:
                return "";
        }
    };

    const handleJoinChat = () => {
        if (!onMatched || !matchId) return;
        onMatched({
            bubble,
            matchId,
            solver: matchedSolver,  
        });
    };

    return (
        <div className="min-h-screen bg-white flex justify-center">
            <div className="w-full max-w-md flex flex-col">
                {/* Header */}
                <header className="bg-white">
                    <div className="h-12 px-4 flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm"
                        >
                            ←
                        </button>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 px-4 pt-2 pb-8 flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-emerald-500 mb-4">
                        Let&apos;s SOLVE !
                    </h1>

                    <div className="relative w-64 h-64 mb-6">
                        <div className="absolute inset-0 rounded-full bg-emerald-400/70" />
                        <div className="absolute inset-6 rounded-full bg-emerald-600" />

                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-emerald-900/40" />
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-emerald-900/40" />

                        <div className="absolute inset-16 rounded-full border border-emerald-200/80" />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center shadow-[0_10px_22px_rgba(15,23,42,0.7)] border-[5px] border-emerald-400">
                                <span className="text-white font-semibold text-xs">
                                    YOU
                                </span>
                            </div>
                        </div>

                        {radarSolvers.map((solver) => (
                            <div
                                key={solver.id}
                                className="absolute transition-transform duration-700"
                                style={{
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) translate(${solver.x}px, ${solver.y}px)`,
                                }}
                            >
                                <div className="w-12 h-12 rounded-full bg-white shadow-md border-[3px] border-emerald-500 overflow-hidden flex items-center justify-center">
                                    {solver.avatarUrl ? (
                                        <img
                                            src={solver.avatarUrl}
                                            alt={solver.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs text-emerald-700 font-semibold">
                                            {solver.name?.[0] || "S"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ข้อความสถานะ */}
                    <p className="text-sm text-slate-800 text-center mb-2">
                        {renderStatusText()}
                    </p>

                    {errorMsg && (
                        <p className="text-[11px] text-red-500 text-center mb-2">
                            {errorMsg}
                        </p>
                    )}

                    <div className="w-full bg-slate-50 rounded-2xl shadow-sm p-4 mb-6">
                        <p className="text-[11px] text-slate-500 mb-1">
                            ปัญหาที่คุณต้องการความช่วยเหลือ
                        </p>
                        <p className="text-sm font-semibold text-slate-800">{title}</p>
                        {description && (
                            <p className="mt-1 text-[12px] text-slate-700">{description}</p>
                        )}
                    </div>

                    {(status === "timeout" || status === "error") ? (
                        <button
                            onClick={onBack}
                            className="mt-auto w-full h-10 rounded-xl bg-slate-200 text-xs font-semibold text-slate-700"
                        >
                            กลับหน้าหลัก
                        </button>
                    ) : (
                        <button
                            onClick={onBack}
                            className="mt-auto w-full h-10 rounded-xl bg-red-500 text-xs font-semibold text-white"
                        >
                            ยกเลิก
                        </button>
                    )}

                    {/* Popup Requester มี solver มารับเคสแล้ว */}
                    {showJoinPopup && status === "matched" && (
                        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="w-full max-w-xs mx-4 rounded-2xl bg-white text-[#555555] p-4 border border-slate-700/70">
                                <h3 className="text-sm font-semibold mb-2">
                                    มี Solver มารับเคสคุณแล้ว
                                </h3>
                                <p className="text-xs text-[#555555] mb-3">
                                    ต้องการเข้าไปคุยในห้องแชทตอนนี้เลยไหม?
                                </p>

                                {matchedSolver && (
                                    <p className="text-[11px] text-[#555555]-300 mb-2">
                                        ผู้ช่วย:{" "}
                                        {matchedSolver.name ||
                                            matchedSolver.display_name ||
                                            "Solver"}
                                    </p>
                                )}

                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="button"
                                        className="flex-1 h-9 rounded-full text-xs border bg-[#ff1a1a] text-white hover:brightness-110"
                                        onClick={() => setShowJoinPopup(false)}
                                    >
                                        รอก่อน
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 h-9 rounded-full text-xs font-semibold text-white bg-[#06c755]  hover:brightness-110"
                                        onClick={handleJoinChat}
                                    >
                                        เข้าแชทตอนนี้
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
