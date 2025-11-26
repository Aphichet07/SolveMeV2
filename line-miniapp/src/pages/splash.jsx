import React from "react";
import "../index.css";

export default function SplashPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white overflow-hidden">
      {/* วงกลมแก้วจาง ๆ ด้านหลัง */}
      <div className="absolute -top-32 -right-10 w-64 h-64 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="absolute -bottom-40 -left-10 w-72 h-72 rounded-full bg-emerald-200/40 blur-3xl" />

      {/* โลโก้ SOLVE ME */}
      <div className="relative text-center animate-splash-logo">
        <p className="text-5xl font-bold tracking-[0.15em] text-[#06c755] drop-shadow-sm">
          SOLVE
        </p>
        <p className="text-lg text-gray-800 font-bold mt-1 tracking-[0.4em] animate-splash-sub">
          ME
        </p>
      </div>
    </div>
  );
}
