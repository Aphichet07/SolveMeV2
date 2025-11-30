// src/components/SolverReviewModal.jsx
import React, { useState, useEffect } from "react";

export default function SolverReviewModal({
  open,
  loading,
  solverName = "ผู้ใช้ฝั่งตรงข้าม",
  onClose,
  onSubmit, // ({ rating, comment }) => Promise<void> | void
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      setRating(5);
      setComment("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!onSubmit) return;
    onSubmit({
      rating,
      comment: comment.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-white border border-slate-200 shadow-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          ให้คะแนนผู้ขอความช่วยเหลือ
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">
          ช่วยรีวิว {solverName} สั้น ๆ หน่อย เพื่อให้ระบบจับคู่ได้ดีขึ้นในอนาคต
        </p>

        {/* Rating stars */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="w-7 h-7 flex items-center justify-center"
            >
              <span
                className={
                  star <= rating
                    ? "text-amber-400 text-xl"
                    : "text-slate-300 text-xl"
                }
              >
                ★
              </span>
            </button>
          ))}
          <span className="ml-1 text-[11px] text-slate-600">
            {rating} / 5
          </span>
        </div>

        {/* Comment box */}
        <div className="mb-3">
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="พิมพ์ความคิดเห็นสั้น ๆ เช่น ตอบเร็ว สุภาพ ชัดเจน ฯลฯ"
            className="w-full text-[12px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-9 rounded-full border border-slate-200 text-xs text-slate-500 bg-white active:scale-95"
          >
            ไว้คราวหน้า
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 h-9 rounded-full text-xs font-semibold text-white ${
              loading
                ? "bg-slate-300"
                : "bg-emerald-500 active:scale-95 shadow-[0_1px_4px_rgba(16,185,129,0.4)]"
            }`}
          >
            {loading ? "กำลังบันทึก..." : "ส่งรีวิว"}
          </button>
        </div>
      </div>
    </div>
  );
}
