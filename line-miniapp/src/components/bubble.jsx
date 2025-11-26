import React, { useEffect, useState } from "react";

export default function Bubble({
  title,
  description,
  profile,
  distanceText,
  priority,
  expiresAtMs,
  onClick,
}) {
  const [remainingText, setRemainingText] = useState("");

  useEffect(() => {
    if (!expiresAtMs) {
      setRemainingText("");
      return;
    }

    function updateCountdown() {
      const diff = expiresAtMs - Date.now(); 
      if (diff <= 0) {
        setRemainingText("หมดเวลาแล้ว");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      const mm = String(minutes).padStart(2, "0");
      const ss = String(seconds).padStart(2, "0");
      setRemainingText(`เหลือเวลาอีก ${mm}:${ss} นาที`);
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [expiresAtMs]);

  return (
    <button
      type="button"
      className="
        relative
        w-40 h-40
        rounded-full
        bg-linear-to-br from-sky-100 via-rose-50 to-emerald-100
        border border-white/70
        shadow-[0_10px_25px_rgba(15,23,42,0.18)]
        overflow-hidden
        hover:scale-105 active:scale-95
        transition-transform duration-150
      "
      onClick={onClick}
    >
      <div className="relative flex flex-col items-center justify-center h-full px-3 py-2 text-center">
        <p className="font-semibold text-[11px] text-slate-800 leading-snug line-clamp-2">
          {title}
        </p>
        <p className="mt-1 text-[10px] text-slate-600 line-clamp-3">
          {description}
        </p>

        {remainingText && (
          <p className="mt-1 text-[9px] text-rose-500 font-medium">
            {remainingText}
          </p>
        )}
       
      </div>
    </button>
  );
}



// import React from "react";

// export default function Bubble({ title, description, profile, onClick }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className="
//         relative
//         w-40 h-40
//         rounded-full
//         overflow-hidden
//         cursor-pointer

//         bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.9),rgba(255,255,255,0)_55%),radial-gradient(circle_at_80%_0%,rgba(186,230,253,0.8),rgba(186,230,253,0)_55%),radial-gradient(circle_at_0%_100%,rgba(252,165,165,0.7),rgba(252,165,165,0)_55%),radial-gradient(circle_at_100%_100%,rgba(167,243,208,0.8),rgba(167,243,208,0)_55%)]
//         border border-white/60
//         shadow-[0_18px_40px_rgba(15,23,42,0.4)]
//         backdrop-blur-xl backdrop-saturate-150

//         hover:scale-105 active:scale-95
//         transition-transform duration-200
//       "
//     >
//       <div
//         className="
//           pointer-events-none
//           absolute -inset-0.5
//           rounded-full
//           bg-[conic-gradient(from_210deg_at_50%_35%,rgba(255,255,255,0.8),rgba(244,114,182,0.7),rgba(56,189,248,0.7),rgba(52,211,153,0.7),rgba(255,255,255,0.9))]
//           opacity-55
//           mix-blend-screen
//         "
//       />

//       <div
//         className="
//           pointer-events-none
//           absolute
//           -top-3 left-2
//           w-20 h-10
//           rounded-full
//           bg-white/70
//           blur-md
//           opacity-70
//         "
//       />

//       <div className="relative flex flex-col items-center justify-center h-full px-3 py-2 text-center bg-white/5">
//         <p
//           className="
//             font-semibold
//             text-[11px] text-slate-800
//             leading-snug
//             line-clamp-2
//             wrap-break-word
//           "
//         >
//           {title}
//         </p>

//         <p
//           className="
//             mt-1
//             text-[10px] text-slate-700
//             leading-snug
//             line-clamp-3
//             wrap-break-word
//           "
//         >
//           {description}
//         </p>

//         {profile && (
//           <p
//             className="
//               mt-1
//               text-[9px] text-slate-500
//               leading-none
//               truncate
//               max-w-[90%]
//             "
//           >
//             by {profile}
//           </p>
//         )}
//       </div>
//     </button>
//   );
// }
