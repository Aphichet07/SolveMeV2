import React, { useState } from "react";

/**
 * Props:
 *  - open: boolean
 *  - loading: boolean
 *  - onClose: () => void
 *  - onSubmit: (amount:number) => void
 */
export default function TipModal({ open, loading, onClose, onSubmit }) {
  const [selected, setSelected] = useState(10);
  const amounts = [10, 20, 50];

  const handleTipSubmit = async (amount) => {
    const res = await fetch(`${API_BASE}/api/tip/create-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_id: tipContext.matchId,
        bubble_id: tipContext.bubbleId,
        from_user_id: userId,
        to_user_id: tipContext.solverId,
        amount,
      }),
    });

    const data = await res.json();
    liff.openWindow({
      url: data.paymentUrl,
      external: true, 
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xs bg-white rounded-2xl p-4 shadow-xl">
        <h3 className="text-sm font-semibold mb-2">
          อยากให้ทิปผู้ช่วยของคุณไหม?
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">
          เลือกจำนวนคะแนนเพื่อขอบคุณ Solver ที่ช่วยคุณเมื่อสักครู่
        </p>

        <div className="flex justify-between mb-3">
          {amounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setSelected(amt)}
              className={`flex-1 mx-1 h-9 rounded-full text-xs font-semibold border transition
                ${
                  selected === amt
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-700 border-slate-300"
                }
              `}
              disabled={loading}
            >
              {amt} คะแนน
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="flex-1 h-9 rounded-full text-xs text-slate-500 border border-slate-300"
            onClick={onClose}
            disabled={loading}
          >
            ไว้คราวหน้า
          </button>
          <button
            type="button"
            className="flex-1 h-9 rounded-full text-xs font-semibold text-white bg-emerald-500 disabled:opacity-60"
            onClick={() => onSubmit(selected)}
            disabled={loading}
          >
            {loading ? "กำลังส่งทิป..." : "ให้ทิป"}
          </button>
        </div>
      </div>
    </div>
  );
}
