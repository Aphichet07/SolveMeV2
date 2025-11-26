
import React from "react";

export default function WalletPage({ onBack }) {

  const balance = 320; 
  const history = [
    { id: 1, from: "Mint", amount: 50, note: "ขอบคุณที่ช่วยซ่อมโน้ตบุ๊ก", time: "วันนี้ · 14:32" },
    { id: 2, from: "Lucas", amount: 120, note: "ช่วยหาสายชาร์จทันเวลา", time: "เมื่อวาน · 19:05" },
    { id: 3, from: "Anon", amount: 150, note: "ช่วยแก้ปัญหา network", time: "2 วันก่อน · 11:20" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md flex flex-col">

        <header className="bg-white border-b border-slate-100">
          <div className="h-12 px-4 flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-slate-800">
              Wallet
            </span>
          </div>
        </header>


        <main className="flex-1 px-4 pt-4 pb-24">

          <section className="bg-emerald-500 rounded-2xl p-4 text-white shadow-sm">
            <p className="text-[11px] opacity-90">ยอดที่ใช้ให้ Tip ได้</p>
            <p className="mt-1 text-2xl font-semibold">{balance.toLocaleString()} ฿</p>
            <p className="mt-1 text-[11px] opacity-90">
              เงินนี้มาจาก Tip ที่ requester ให้คุณหลังจากช่วยแก้ปัญหา
            </p>
          </section>

          <section className="mt-3 flex gap-2">
            <button className="flex-1 h-9 rounded-xl bg-white text-xs font-medium text-slate-800 shadow-sm active:scale-[0.98] transition-transform">
              เติมเงิน (Coming soon)
            </button>
            <button className="flex-1 h-9 rounded-xl bg-white text-xs font-medium text-slate-800 shadow-sm active:scale-[0.98] transition-transform">
              ถอนเงิน (Coming soon)
            </button>
          </section>
          <section className="mt-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              ประวัติ Tip ล่าสุด
            </p>

            {history.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                ยังไม่มีประวัติ Tip ในตอนนี้
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="bg-white rounded-xl px-3 py-2 shadow-sm flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        จาก {h.from}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {h.note}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {h.time}
                      </p>
                    </div>
                    <div className="ml-2 text-right">
                      <p className="text-xs font-semibold text-emerald-600">
                        +{h.amount.toLocaleString()} ฿
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
