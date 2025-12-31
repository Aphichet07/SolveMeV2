import React, { useState } from "react";
import Header from "../components/header.jsx";
import FooterNav from "../components/footer.jsx";

const OPTION_SET = [
  { value: "ALWAYS", label: "แทบทุกครั้ง" },
  { value: "SOMETIMES", label: "บางครั้ง" },
  { value: "RARELY", label: "แทบไม่เคย / ไม่เคยเลย" },
];
const CarryProfilePage = ({ lineId, onCompleted }) => {
  const [form, setForm] = useState({
    powerbank_freq: "",
    cable_freq: "",
    tissue_freq: "",
    tools_freq: "",
    healthkit_freq: "",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const allAnswered = Object.values(form).every((v) => v !== "");

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered || loading) return;

    setLoading(true);
    setSaved(false);
    setErrorMsg("");

    console.log("line id: ", lineId);

    try {
      const res = await fetch("/api/profile/carry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line_id: lineId,
          carry_profile: form,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setSaved(true);

      if (onCompleted) {
        onCompleted(form);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (id, title, description) => (
    <div className="rounded-2xl bg-white/80 shadow-sm border border-slate-200/70 p-4 mb-4">
      <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}

      <div className="mt-3 space-y-2">
        {OPTION_SET.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm cursor-pointer transition
              ${
                form[id] === opt.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
          >
            <span className="text-slate-800">{opt.label}</span>
            <input
              type="radio"
              className="accent-emerald-500"
              name={id}
              value={opt.value}
              checked={form[id] === opt.value}
              onChange={() => handleChange(id, opt.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="max-w-xl mx-auto">
          <div className="mb-4">
            <h1 className="text-lg font-bold text-slate-900">
              ของที่คุณพกติดตัวบ่อย ๆ
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              ข้อมูลนี้จะช่วยให้ระบบจับคู่คนที่{" "}
              <span className="font-semibold">มีของพร้อมช่วยคุณ</span> ได้ดีขึ้น
              โดยไม่โชว์ข้อมูลแบบละเอียดกับคนอื่น
            </p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>ความคืบหน้า</span>
              <span>
                {Object.values(form).filter((v) => v !== "").length} / 5
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${
                    (Object.values(form).filter((v) => v !== "").length / 5) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {renderQuestion(
              "powerbank_freq",
              "ปกติคุณพกพาวเวอร์แบงก์ติดตัวบ่อยแค่ไหน?",
              "ช่วยให้เรารู้ว่าคุณน่าจะช่วยคนที่แบตจะหมดได้หรือไม่"
            )}

            {renderQuestion(
              "cable_freq",
              "คุณพกสายชาร์จมือถือ (เช่น Type-C / iPhone) บ่อยไหม?",
              "ใช้สำหรับเคสขอสายชาร์จด่วน"
            )}

            {renderQuestion(
              "tissue_freq",
              "คุณพกทิชชู่หรือกระดาษเช็ดมือไว้ในกระเป๋าบ่อยไหม?",
              "เช่น ช่วยคนที่ทำของหกหรือเลอะ"
            )}

            {renderQuestion(
              "tools_freq",
              "คุณมีของใช้จุกจิกที่มักพกติดตัวไหม? เช่น ปากกา เทปใส คัตเตอร์เล็ก ฯลฯ",
              "ของพวกนี้ช่วยแก้ปัญหาเล็ก ๆ รอบตัวได้หลายแบบ"
            )}

            {renderQuestion(
              "healthkit_freq",
              "คุณพกหน้ากากสำรองหรือยาสามัญ (เช่น ยาแก้ปวด/ยาแพ้) ติดตัวไหม?",
              "สำหรับเคสช่วยเหลือด้านสุขภาพเบื้องต้น"
            )}

            {errorMsg && (
              <div className="mt-2 text-xs text-red-600">{errorMsg}</div>
            )}
            {saved && !errorMsg && (
              <div className="mt-2 text-xs text-emerald-600">
                บันทึกข้อมูลเรียบร้อยแล้ว 🎉
              </div>
            )}

            <button
              type="submit"
              disabled={!allAnswered || loading}
              className={`mt-4 w-full rounded-2xl py-2.5 text-sm font-semibold
                ${
                  !allAnswered || loading
                    ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                    : "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700"
                }`}
            >
              {loading ? "กำลังบันทึก..." : "บันทึกโปรไฟล์ของที่พกติดตัว"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CarryProfilePage;
