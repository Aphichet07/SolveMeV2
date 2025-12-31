import React from "react";
import { useNavigate } from "react-router-dom";

const LIFF_COUPON_URL =
  import.meta.env.VITE_LIFF_COUPON_URL ||
  "https://liff.line.me/YOUR_COUPON_LIFF_ID";

/**
 * WalletPage
 * - แสดงแต้มสะสมของ user (score)
 * - แสดงรายการคูปองที่สามารถแลกได้
 * - เมื่อกดแลก → เด้งไปที่ LINE (ผ่าน LIFF / deep link) พร้อมส่ง couponId ไป
 *
 * @param {Object} props
 * @param {() => void} props.onBack      ฟังก์ชันกลับหน้าเดิม
 * @param {Object} [props.profile]       โปรไฟล์ user (อาจมี score มาจาก backend)
 * @param {number} [props.profile.score] คะแนนสะสมของ user
 */
export default function WalletPage({ onBack, profile }) {
  // แต้มของ user (ถ้ามี score จาก backend ก็ใช้เลย, ถ้าไม่มีก็ fallback เป็น 320 ไว้ demo)
  const points = typeof profile?.score === "number" ? profile.score : 320;

  // ตัวอย่างคูปอง (mock data) — ภายหลังจะให้ backend ส่งมาก็ได้
  const coupons = [
    {
      id: "coffee-50",
      title: "คูปองกาแฟ 1 แก้ว",
      cost: 50,
      description: "ใช้แลกกาแฟที่ร้านพาร์ทเนอร์ที่ร่วมรายการ",
    },
    {
      id: "discount-100",
      title: "ส่วนลด 100 บาท",
      cost: 100,
      description: "ลดทันที 100 บาท เมื่อใช้บริการร้านที่ร่วมรายการ",
    },
    {
      id: "voucher-200",
      title: "Voucher ของขวัญ 200 บาท",
      cost: 200,
      description: "ส่งเป็นของขวัญให้เพื่อนได้ผ่าน LINE",
    },
  ];

  // ประวัติ tip ยังเก็บไว้เป็นตัวอย่าง (ใช้ "แต้ม" แทน ฿)
  const history = [
    {
      id: 1,
      from: "Mint",
      amount: 50,
      note: "ขอบคุณที่ช่วยซ่อมโน้ตบุ๊ก",
      time: "วันนี้ · 14:32",
    },
    {
      id: 2,
      from: "Lucas",
      amount: 120,
      note: "ช่วยหาสายชาร์จทันเวลา",
      time: "เมื่อวาน · 19:05",
    },
    {
      id: 3,
      from: "Anon",
      amount: 150,
      note: "ช่วยแก้ปัญหา network",
      time: "2 วันก่อน · 11:20",
    },
  ];

  const handleRedeemCoupon = (coupon) => {
    // TODO: ถ้าต้องการหักแต้มจริง ๆ ให้เรียก backend ก่อน เช่น /api/coupon/redeem

    // เด้งไปหน้า LIFF / LINE พร้อมส่ง couponId และคะแนนปัจจุบันไป (เผื่อใช้ validate ฝั่ง backend)
    const params = new URLSearchParams({
      couponId: coupon.id,
      cost: String(coupon.cost),
      points: String(points),
    });

    const url = `${LIFF_COUPON_URL}?${params.toString()}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-100">
          <div className="h-12 px-4 flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-slate-800">Wallet</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 pt-4 pb-24">
          {/* แต้มสะสม */}
          <section className="bg-emerald-500 rounded-2xl p-4 text-white shadow-sm">
            <p className="text-[11px] opacity-90">แต้มสะสมที่ใช้แลกคูปองได้</p>
            <p className="mt-1 text-2xl font-semibold">
              {points.toLocaleString()} pts
            </p>
            <p className="mt-1 text-[11px] opacity-90">
              แต้มนี้มาจาก Tip ที่ requester ให้คุณหลังจากช่วยแก้ปัญหา
            </p>
          </section>

          {/* ปุ่มเติม/ถอน — ไว้ทำทีหลัง */}
          <section className="mt-3 flex gap-2">
            <button className="flex-1 h-9 rounded-xl bg-white text-xs font-medium text-slate-800 shadow-sm active:scale-[0.98] transition-transform">
              เติมแต้ม (Coming soon)
            </button>
            <button className="flex-1 h-9 rounded-xl bg-white text-xs font-medium text-slate-800 shadow-sm active:scale-[0.98] transition-transform">
              ถอนแต้ม (Coming soon)
            </button>
          </section>

          {/* คูปองที่แลกได้ */}
          <section className="mt-5">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              คูปองที่สามารถแลกได้
            </p>

            <div className="space-y-2">
              {coupons.map((c) => {
                const canRedeem = points >= c.cost;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl px-3 py-3 shadow-sm flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {c.description}
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-1">
                        ใช้ {c.cost.toLocaleString()} pts
                      </p>
                    </div>

                    <div className="ml-2 flex flex-col items-end gap-1">
                      <button
                        type="button"
                        disabled={!canRedeem}
                        onClick={() => handleRedeemCoupon(c)}
                        className={`px-3 h-8 rounded-full text-[11px] font-semibold ${
                          canRedeem
                            ? "bg-emerald-500 text-white active:scale-95"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        แลกคูปอง
                      </button>
                      {!canRedeem && (
                        <span className="text-[10px] text-slate-400">
                          แต้มยังไม่พอ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ประวัติ Tip */}
          <section className="mt-5">
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
                        +{h.amount.toLocaleString()} pts
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

// import React from "react";

// export default function WalletPage({ onBack }) {

//   const balance = 320;
//   const history = [
//     { id: 1, from: "Mint", amount: 50, note: "ขอบคุณที่ช่วยซ่อมโน้ตบุ๊ก", time: "วันนี้ · 14:32" },
//     { id: 2, from: "Lucas", amount: 120, note: "ช่วยหาสายชาร์จทันเวลา", time: "เมื่อวาน · 19:05" },
//     { id: 3, from: "Anon", amount: 150, note: "ช่วยแก้ปัญหา network", time: "2 วันก่อน · 11:20" },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 flex justify-center">
//       <div className="w-full max-w-md flex flex-col">

//         <header className="bg-white border-b border-slate-100">
//           <div className="h-12 px-4 flex items-center gap-3">
//             <button
//               onClick={onBack}
//               className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm"
//             >
//               ←
//             </button>
//             <span className="text-sm font-semibold text-slate-800">
//               Wallet
//             </span>
//           </div>
//         </header>

//         <main className="flex-1 px-4 pt-4 pb-24">

//           <section className="bg-emerald-500 rounded-2xl p-4 text-white shadow-sm">
//             <p className="text-[11px] opacity-90">ยอดที่ใช้ให้ Tip ได้</p>
//             <p className="mt-1 text-2xl font-semibold">{balance.toLocaleString()} ฿</p>
//             <p className="mt-1 text-[11px] opacity-90">
//               เงินนี้มาจาก Tip ที่ requester ให้คุณหลังจากช่วยแก้ปัญหา
//             </p>
//           </section>

//           <section className="mt-3 flex gap-2">
//             <button className="flex-1 h-9 rounded-xl bg-white text-xs font-medium text-slate-800 shadow-sm active:scale-[0.98] transition-transform">
//               เติมเงิน (Coming soon)
//             </button>
//             <button className="flex-1 h-9 rounded-xl bg-white text-xs font-medium text-slate-800 shadow-sm active:scale-[0.98] transition-transform">
//               ถอนเงิน (Coming soon)
//             </button>
//           </section>
//           <section className="mt-4">
//             <p className="text-xs font-semibold text-slate-700 mb-2">
//               ประวัติ Tip ล่าสุด
//             </p>

//             {history.length === 0 ? (
//               <p className="text-[11px] text-slate-500">
//                 ยังไม่มีประวัติ Tip ในตอนนี้
//               </p>
//             ) : (
//               <div className="space-y-2">
//                 {history.map((h) => (
//                   <div
//                     key={h.id}
//                     className="bg-white rounded-xl px-3 py-2 shadow-sm flex items-start justify-between"
//                   >
//                     <div className="flex-1 min-w-0">
//                       <p className="text-xs font-medium text-slate-800 truncate">
//                         จาก {h.from}
//                       </p>
//                       <p className="text-[11px] text-slate-500 truncate">
//                         {h.note}
//                       </p>
//                       <p className="text-[10px] text-slate-400 mt-1">
//                         {h.time}
//                       </p>
//                     </div>
//                     <div className="ml-2 text-right">
//                       <p className="text-xs font-semibold text-emerald-600">
//                         +{h.amount.toLocaleString()} ฿
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </section>
//         </main>
//       </div>
//     </div>
//   );
// }
