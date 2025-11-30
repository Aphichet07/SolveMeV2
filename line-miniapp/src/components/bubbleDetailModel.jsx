import React from "react";

export default function BubbleDetailModal({
  open,
  bubble,
  onClose,
  onMatch,
  isMatching,
}) {
  if (!open || !bubble) return null;

  const handleMatchClick = () => {
    if (isMatching) return;
    onMatch?.(bubble);
  };

  return (
    <div
      className="
        fixed inset-0 z-40
        flex items-center justify-center
        bg-black/40
        backdrop-blur-sm
      "
    >
      <div
        className="
          relative
          w-full max-w-md
          mx-4
          rounded-3xl
          bg-white
          border border-white/10
          shadow-[0_20px_60px_rgba(15,23,42,0.8)]
          text-slate-50
          p-5
        "
      >
        {/* ปุ่มปิดมุมขวาบน */}
        <button
          type="button"
          onClick={onClose}
          className="
            absolute right-3 top-3
            w-7 h-7
            rounded-full
            flex items-center justify-center
            text-slate-300
            hover:bg-slate-700/60 hover:text-white
            text-sm
          "
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="
              w-10 h-10 rounded-full
              bg-linear-to-br from-sky-300 via-pink-300 to-emerald-300
              opacity-80
              shadow-[0_8px_20px_rgba(56,189,248,0.7)]
            "
          />
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-[#06c755]">
              Bubble Detail
            </div>
            <h2 className="text-base font-semibold text-[#06c755] line-clamp-2">
              {bubble.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 text-sm">
          <div className="rounded-2xl bg-slate-800/10 border border-slate-700/80 p-3">
            <div className="text-[11px] font-medium text-slate-400 mb-1.5">
              รายละเอียดปัญหา
            </div>
            <p className="text-black whitespace-pre-wrap wrap-break-word">
              {bubble.description}
            </p>
          </div>

          {bubble.profile && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex h-6 w-6 rounded-full bg-slate-700/80 items-center justify-center text-[11px]">
              </span>
              <span>เจ้าของปัญหา: {bubble.profile}</span>
            </div>
          )}

          {/*  เพิ่ม field reward, distance, expiresInMinutes*/}
          {bubble.reward && (
            <div className="text-xs text-emerald-300">
              สินน้ำใจโดยประมาณ: {bubble.reward}
            </div>
          )}

          {bubble.distance && (
            <div className="text-xs text-sky-300">
              ระยะห่าง: ~{bubble.distance} เมตร
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1
              h-10
              rounded-full
              border border-slate-600
              text-sm
              text-slate-800
              hover:bg-slate-700/80
              transition-colors
            "
          >
            ย้อนกลับ
          </button>

          <button
            type="button"
            onClick={handleMatchClick}
            disabled={isMatching}
            className={`
              flex-1
              h-10
              rounded-full
              text-sm font-semibold
              text-slate-900
              bg-[#06c755]
              shadow-[0_10px_30px_rgba(56,189,248,0.7)]
              hover:brightness-110
              active:translate-y-px
              transition
              ${isMatching ? "opacity-70 cursor-wait" : ""}
            `}
          >
            {isMatching ? "กำลังสร้างห้อง..." : "Match"}
          </button>
        </div>
      </div>
    </div>
  );
}
