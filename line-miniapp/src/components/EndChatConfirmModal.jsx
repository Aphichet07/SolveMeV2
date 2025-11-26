// src/components/EndChatConfirmModal.jsx
import React from "react";

export default function EndChatConfirmModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-[80%] max-w-xs bg-white rounded-2xl shadow-xl p-4">
        <p className="text-sm font-semibold text-slate-800 mb-1">
          จบการสนทนาแล้วใช่ไหม?
        </p>
        <p className="text-[11px] text-slate-500 mb-4">
          เมื่อจบการสนทนา ระบบจะลบประวัติแชทของห้องนี้ออกจาก SolveMe
        </p>
        <div className="flex justify-end gap-2 text-[12px]">
          <button
            className="px-3 h-8 rounded-full bg-slate-100 text-slate-700"
            onClick={onCancel}
          >
            ยกเลิก
          </button>
          <button
            className="px-3 h-8 rounded-full bg-red-500 text-white"
            onClick={onConfirm}
          >
            จบแชท
          </button>
        </div>
      </div>
    </div>
  );
}
