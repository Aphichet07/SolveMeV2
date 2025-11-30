// components/SolverWaitToggle.jsx
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function SolverWaitToggle({ profile, geo, initialWaitMode }) {
  const [waitMode, setWaitMode] = useState(!!initialWaitMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!profile?.userId) return null;

  const handleToggle = async () => {
    setErrorMsg("");
    const next = !waitMode;

    try {
      setLoading(true);

      const payload = {
        line_id: profile.userId,
        wait: next,
      };

      if (geo && typeof geo.lat === "number" && typeof geo.lon === "number") {
        payload.location = {
          lat: geo.lat,
          lon: geo.lon,
        };
      }

      const res = await fetch(`${API_BASE}/api/solver/wait`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        console.error("[SolverWaitToggle] error:", data);
        setErrorMsg(data.message || "อัปเดตสถานะรอเคสไม่สำเร็จ");
        return;
      }

      setWaitMode(next);
    } catch (err) {
      console.error("[SolverWaitToggle] toggle error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setLoading(false);
    }
  };

  const label = waitMode ? "กำลังรอเคสอยู่" : "ปิดรับเคสชั่วคราว";
  const sublabel = waitMode
    ? "ระบบจะจับคู่ปัญหาใกล้คุณให้อัตโนมัติ แม้คุณออกจากแอปไป"
    : "คุณจะไม่ถูกจับคู่เคสใหม่ จนกว่าจะเปิดอีกครั้ง";

  return (
    <div className="mt-2 mb-3 rounded-2xl bg-[#05b14a] text-white px-3 py-3 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-[11px] font-semibold">{label}</p>
        <p className="text-[10px] text-white mt-0.5">{sublabel}</p>
        {errorMsg && (
          <p className="mt-1 text-[10px] text-amber-300">{errorMsg}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200
          ${waitMode ? "bg-emerald-400" : "bg-slate-500"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow
            transition-transform duration-200
            ${waitMode ? "translate-x-5" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}
