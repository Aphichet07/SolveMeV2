// src/components/DailyQuestAccordion.jsx
import React, { useState, useEffect } from "react";

export default function DailyQuestAccordion({ lineId, className = "" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quests, setQuests] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (!open) return;
    if (!lineId) return;
    if (quests.length > 0 || loading) return;

    async function fetchDailyQuests() {
      try {
        setLoading(true);
        setErrorMsg("");

        const url = `${API_BASE}/api/quests/daily?lineId=${encodeURIComponent(
          lineId
        )}`;

        console.log(url)

        const res = await fetch(url);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "โหลดเควสไม่สำเร็จ");
        }

        const data = await res.json();
        const q = data.quests || [];
        setQuests(q);
      } catch (err) {
        console.error("fetchDailyQuests error:", err);
        setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลดเควส");
      } finally {
        setLoading(false);
      }
    }

    fetchDailyQuests();
  }, [open, lineId, API_BASE, quests.length, loading]);

  const toggleOpen = () => {
    if (!lineId) {
      setErrorMsg("ไม่พบ lineId สำหรับโหลดเควส");
    }
    setOpen((prev) => !prev);
  };

  const renderStatusBadge = (quest) => {
    if (quest.completed) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
          สำเร็จแล้ว
        </span>
      );
    }
    if (quest.progress > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700">
          กำลังทำ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
        ยังไม่ได้เริ่ม
      </span>
    );
  };

  const renderQuestItem = (quest) => {
    const progress = quest.progress || 0;
    const target = quest.target || 1;
    const pct = Math.min(100, Math.round((progress / target) * 100));

    return (
      <div
        key={quest.id}
        className="rounded-2xl bg-white/70 border border-slate-100 px-3 py-2 mb-2 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-slate-800">
              {quest.title}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">
              เควสประจำวัน • เป้าหมาย {target} ครั้ง
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {renderStatusBadge(quest)}
            {quest.rewardScore != null && (
              <div className="text-[10px] text-amber-600 font-semibold">
                +{quest.rewardScore} คะแนน
              </div>
            )}
          </div>
        </div>

        {/* progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>
              ความคืบหน้า: {progress}/{target}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                quest.completed
                  ? "bg-emerald-400"
                  : "bg-[#06c755]"
              } transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* หัวข้อที่กดได้ */}
      <button
        type="button"
        onClick={toggleOpen}
        className="
          w-full
          flex items-center justify-between
          rounded-2xl
          bg-white/90
          border border-slate-100
          px-3 py-2
          shadow-[0_6px_16px_rgba(15,23,42,0.06)]
          active:scale-[0.99]
          transition
        "
      >
        <div className="flex items-center gap-2">
          <div
            className="
              w-7 h-7 rounded-full
              bg-linear-to-br from-emerald-400 via-sky-400 to-lime-400
              flex items-center justify-center
              text-xs font-bold text-white
              shadow-[0_4px_10px_rgba(34,197,94,0.6)]
            "
          >
            Q
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[12px] font-semibold text-slate-800">
              Daily Quest (Solver)
            </span>
            <span className="text-[10px] text-slate-500">
              ภารกิจวันนี้ รับคะแนนเพิ่มจากการช่วยคน
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          {loading ? (
            <span>กำลังโหลด…</span>
          ) : (
            <span>{open ? "ซ่อน" : "แสดง"}</span>
          )}
          <span
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* เนื้อหา quest ที่เลื่อนลงมา */}
      <div
        className={`
          overflow-hidden
          transition-[max-height,opacity,transform]
          duration-300
          ${open ? "max-h-96 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
        `}
      >
        <div className="mt-2 px-1">
          {errorMsg && (
            <div className="mb-2 text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
              {errorMsg}
            </div>
          )}

          {!errorMsg && !loading && quests.length === 0 && (
            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              วันนี้ยังไม่มีเควสสำหรับคุณ
            </div>
          )}

          {!errorMsg && quests.length > 0 && (
            <div>
              {quests.map((q) => renderQuestItem(q))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
