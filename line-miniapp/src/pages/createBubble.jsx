import React, { useState, useEffect } from "react";
import GuEng from "../assets/image.png"

export default function CreateBubblePage({ profile, onBack, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const userId = profile?.userId;
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("geo error: ", err);
      }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!userId) {
      setErrorMsg("ไม่พบ userId จาก LINE โปรดลองล็อกอินใหม่อีกครั้ง");
      return;
    }

    if (!geo) {
      setErrorMsg(
        "กำลังดึงตำแหน่งของคุณอยู่ หรือคุณยังไม่อนุญาตให้ใช้ตำแหน่ง\n" +
        "กรุณาอนุญาตการเข้าถึง Location แล้วลองกดสร้างปัญหาอีกครั้ง"
      );
      return;
    }

    const payload = {
      title,
      description,
      expiresInMinutes: Number(minutes) || 0,
      userId,
      location: geo,  
    };

    console.log("CreateBubble payload =", payload);

    try {
      setIsSubmitting(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bubbles/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "สร้าง bubble ไม่สำเร็จ");
      }

      const data = await res.json();
      console.log("Create bubble success:", data);

      setTitle("");
      setDescription("");
      setMinutes("");

      if (onCreated) {
        onCreated(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการสร้าง bubble");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        {/* header */}
        <header className="bg-white border-b border-slate-100">
          <div className="h-12 px-4 flex items-center gap-3">

            <span className="text-4xl text-[#06c755] font-bold">
              Let's SOLVE!
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-24">
          <div className="flex flex-col items-center gap-1 text-[11px] mb-10">
            <img src={GuEng} alt="bubble-image" className="w-[100px] " />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-1.5 mb-1">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-left block text-xs font-medium text-slate-700">
                หัวข้อ
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full h-9 rounded-md bg-gray-100 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-left block text-xs font-medium text-slate-700">
                รายละเอียดปัญหา
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-left block text-xs font-medium text-slate-700">
                ระยะเวลาที่ปัญหายังมีผล (นาที)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                required
                className="w-28 h-9 rounded-md bg-gray-100 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 transition-transform"
              >
                {isSubmitting ? "กำลังสร้างปัญหา…" : "สร้างปัญหา"}
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onBack}
                className="w-full h-9 rounded-xl bg-transparent text-xs text-slate-500"
              >
                ยกเลิกและกลับหน้าก่อนหน้า
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
