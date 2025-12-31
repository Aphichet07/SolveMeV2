import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * TipPage
 *
 * - หน้าหลังจบแชท:
 *   - backend ถูกเรียก /api/chat/complete ไปแล้ว (เพิ่มคะแนน requester + solver แล้ว)
 *   - หน้านี้เอาไว้ให้ requester ให้ทิป solver + กดจ่ายผ่าน LINE Pay
 *
 * Props
 *  - profile: โปรไฟล์ฝั่ง requester
 *  - tipContext: {
 *       matchId: string;
 *       bubble?: any;
 *       solver?: { id: string; display_name?: string; name?: string; avatarUrl?: string; avatar_url?: string; };
 *       requesterId: string;
 *    }
 *  - onBackHome: () => void   // กลับหน้า Home
 */
export default function TipPage({ profile, tipContext, onBackHome }) {
  const [amount, setAmount] = useState(20);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!tipContext) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-sm text-slate-500">
          ไม่มีข้อมูลทิป
          <button
            type="button"
            className="mt-3 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs"
            onClick={onBackHome}
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const { matchId, bubble, solver, requesterId } = tipContext;
  const solverName = solver?.display_name || solver?.name || "ผู้ช่วยของคุณ";

  const handleSendTipAndPay = async () => {
    setErrorMsg("");
    const tipValue = Number(amount);
    if (!tipValue || tipValue <= 0) {
      setErrorMsg("กรุณาใส่จำนวนทิปให้ถูกต้อง");
      return;
    }

    try {
      setSubmitting(true);

      // 1) บันทึก tip ในระบบ (คะแนน / history)
      try {
        const payload = {
          match_id: matchId,
          bubble_id: bubble?.id || bubble?.bubble_id || bubble?._id || null,
          from_user_id: requesterId,
          to_user_id: solver?.id,
          amount: tipValue,
        };

        const res = await fetch(`${API_BASE}/api/tip/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("[TipPage] /api/tip/send error:", data);
        }
      } catch (err) {
        console.error("[TipPage] send tip error:", err);
      }

      // 2) เริ่ม Payment กับ LINE Pay (mock endpoint)
      // TODO: เปลี่ยน path ให้ตรงกับ backend จริงของคุณ
      try {
        const res = await fetch(`${API_BASE}/api/linepay/create-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: tipValue,
            currency: "THB",
            match_id: matchId,
            solver_id: solver?.id,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("[TipPage] /api/linepay/create-checkout error:", data);
        } else {
          const data = await res.json().catch(() => ({}));
          console.log("[TipPage] linepay create-checkout =", data);

          const paymentUrl =
            data.paymentUrl?.web ||
            data.paymentUrl?.app ||
            data.paymentUrl ||
            null;

          if (paymentUrl) {
            window.location.href = paymentUrl;
            return;
          }
        }
      } catch (err) {
        console.error("[TipPage] linepay error:", err);
      }

      // ถ้าไม่มี redirect จาก LINE Pay
      onBackHome && onBackHome();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-100">
          <div className="h-12 px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onBackHome}
              className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm"
            >
              ←
            </button>
            <span className="text-xs font-semibold text-slate-800">
              ให้ทิปผู้ช่วย
            </span>
            <div className="w-7" />
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 px-5 pt-6 pb-10">
          <h1 className="text-xl font-bold text-emerald-500 mb-2">
            ขอบคุณที่ช่วยกัน SOLVE 🌱
          </h1>
          <p className="text-xs text-slate-500 mb-4">
            เราได้เพิ่มคะแนนให้ทั้งคุณและ {solverName} แล้ว
            หากคุณอยากสนับสนุนผู้ช่วยเพิ่มเติม สามารถให้ทิปผ่าน LINE Pay ได้เลย
          </p>

          <div className="mt-3 mb-5 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-500 mb-1">เคสที่เพิ่งจบไป</p>
            <p className="text-sm font-semibold text-slate-900">
              {bubble?.title || "ปัญหาที่คุณสร้างไว้"}
            </p>
            {bubble?.description && (
              <p className="mt-1 text-[12px] text-slate-700 line-clamp-3">
                {bubble.description}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 mb-4">
            <p className="text-[11px] text-emerald-700 mb-1">
              คุณอยากให้ทิป {solverName} เท่าไหร่ดี?
            </p>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min={1}
                max={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-24 h-9 rounded-lg border border-emerald-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-xs text-emerald-700">คะแนน / บาท</span>
            </div>

            <div className="flex gap-2 mt-3">
              {[10, 20, 50, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className="flex-1 h-8 rounded-full bg-white border border-emerald-200 text-[11px] text-emerald-700 active:scale-95"
                >
                  {v}
                </button>
              ))}
            </div>

            {errorMsg && (
              <p className="mt-2 text-[11px] text-red-500">{errorMsg}</p>
            )}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSendTipAndPay}
            className={`
              w-full h-10 rounded-xl text-sm font-semibold
              flex items-center justify-center
              ${
                submitting
                  ? "bg-slate-300 text-slate-500"
                  : "bg-emerald-500 text-white active:scale-95"
              }
            `}
          >
            {submitting ? "กำลังดำเนินการ..." : "ให้ทิปและจ่ายด้วย LINE Pay"}
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="mt-3 w-full h-9 rounded-xl bg-transparent text-xs text-slate-400"
          >
            ข้ามไปก่อน กลับหน้าหลัก
          </button>
        </main>
      </div>
    </div>
  );
}

// // components/TipModal.jsx
// export default function TipModal({ open, onClose, onSubmit }) {
//   const [selected, setSelected] = useState(10);

//   if (!open) return null;

//   const amounts = [10, 20, 50];

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="w-full max-w-xs bg-white rounded-2xl p-4">
//         <h3 className="text-sm font-semibold mb-2">อยากให้ทิปผู้ช่วยของคุณไหม?</h3>
//         <p className="text-[11px] text-slate-500 mb-3">
//           เลือกจำนวนคะแนนเพื่อขอบคุณ Solver ที่ช่วยคุณเมื่อสักครู่
//         </p>
//         <div className="flex justify-between mb-3">
//           {amounts.map((amt) => (
//             <button
//               key={amt}
//               type="button"
//               onClick={() => setSelected(amt)}
//               className={`flex-1 mx-1 h-9 rounded-full text-xs font-semibold border
//                 ${selected === amt ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-700 border-slate-300"}
//               `}
//             >
//               {amt} คะแนน
//             </button>
//           ))}
//         </div>

//         <div className="flex gap-2 mt-2">
//           <button
//             type="button"
//             className="flex-1 h-9 rounded-full text-xs text-slate-500 border border-slate-300"
//             onClick={onClose}
//           >
//             ไว้คราวหน้า
//           </button>
//           <button
//             type="button"
//             className="flex-1 h-9 rounded-full text-xs font-semibold text-white bg-emerald-500"
//             onClick={() => onSubmit(selected)}
//           >
//             ให้ทิป
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
