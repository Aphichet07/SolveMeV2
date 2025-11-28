// src/pages/TipAfterChatPage.jsx
import React, { useState } from "react";

export default function TipAfterChatPage({
  profile,        
  solver,         
  matchId,       
  onSkip,        
  onPaidStart,    
}) {
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const quickAmounts = [30, 50, 100];

  const handlePay = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      onPaidStart && onPaidStart();

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/tips/linepay/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency: "THB",
            matchId,
            solverId: solver?.id,
            payerLineId: profile?.userId,
          }),
        }
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "สร้างคำขอชำระเงินไม่สำเร็จ");
      }

      const data = await res.json();

      if (data.paymentUrl?.web) {
        window.location.href = data.paymentUrl.web;
      } else if (data.paymentUrl?.app) {
        window.location.href = data.paymentUrl.app;
      } else {
        throw new Error("ไม่พบ paymentUrl จาก LINE Pay");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการสร้างคำขอชำระเงิน");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        <header className="px-4 pt-4 pb-2">
          <p className="text-lg font-semibold text-slate-900">
            ให้ Tip กับ Solver ไหม?
          </p>
          {solver?.name && (
            <p className="text-xs text-slate-500 mt-1">
              ขอบคุณ {solver.name} สำหรับการช่วยเหลือในครั้งนี้
            </p>
          )}
        </header>

        <main className="flex-1 px-4 pt-2 pb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-2">
              เลือกจำนวน Tip ที่ต้องการให้
            </p>

            <div className="flex gap-2 mb-3">
              {quickAmounts.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`flex-1 h-9 rounded-full text-sm font-semibold border
                    ${
                      amount === v
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-slate-200 text-slate-700"
                    }
                  `}
                >
                  {v.toLocaleString()} ฿
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500">หรือกรอกจำนวนเอง</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="flex-1 h-8 rounded-lg border border-slate-200 px-2 text-sm outline-none"
              />
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-500 mb-2">{errorMsg}</p>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                disabled={loading || amount <= 0}
                onClick={handlePay}
                className={`h-10 rounded-xl text-sm font-semibold
                  ${
                    loading || amount <= 0
                      ? "bg-slate-200 text-slate-400"
                      : "bg-emerald-500 text-white active:scale-95"
                  }
                `}
              >
                {loading
                  ? "กำลังสร้างคำขอชำระเงิน…"
                  : `ชำระด้วย LINE Pay ${amount.toLocaleString()} ฿`}
              </button>

              <button
                type="button"
                onClick={onSkip}
                className="h-9 rounded-xl text-xs text-slate-500 border border-slate-200 bg-white active:scale-95"
              >
                ข้าม ไม่ให้ Tip ครั้งนี้
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
