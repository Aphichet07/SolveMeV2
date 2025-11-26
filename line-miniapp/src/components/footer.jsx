import React from "react";
import WalletIcon from "../assets/wallet.png";
import ProfileIcon from "../assets/user.png";
import HomeIcon from "../assets/home.png";

export default function FooterNav({
  onPlusClick,
  onHomeClick,
  onWalletClick,
  onProfileClick,
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 pointer-events-none z-40">

      <div className="relative w-full h-24 flex items-end">

        <div
          className="
            footer-curved
            w-full
            flex items-center justify-between
            px-10
            text-white
            pointer-events-auto
            z-10
          "
        >
          <button
            onClick={onWalletClick}
            className="flex flex-col items-center gap-1 text-[11px]"
          >
            <img src={WalletIcon} alt="wallet" className="w-5 h-5" />
            <span className="font-medium">Wallet</span>
          </button>

          <div className="w-16" />

          <button
            onClick={onProfileClick}
            className="flex flex-col items-center gap-1 text-[11px]"
          >
            <img src={ProfileIcon} alt="profile" className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
        </div>

        <button
          onClick={onHomeClick}
          className="
            absolute -top-4 left-1/2 -translate-x-1/2
            w-16 h-16
            rounded-full
            bg-[#3b3b3b]
            flex items-center justify-center
            text-white
            pointer-events-auto
            shadow-[0_1px_8px_rgba(15,23,42,0.55)]
            border-4 border-white
            active:scale-95
            transition-transform duration-150
            z-20
          "
        >
          <img src={HomeIcon} alt="home" className="w-6 h-6 invert" />
        </button>

        <button
          onClick={onPlusClick}
          className="
            absolute -top-12 right-6
            w-12 h-12
            rounded-full
            bg-[#3b3b3b]
            flex items-center justify-center
            text-white text-2xl
            border-[3px] border-white
            shadow-[0_10px_24px_rgba(15,23,42,0.45)]
            pointer-events-auto
            active:scale-95
            transition-transform duration-150
            z-20
          "
        >
          +
        </button>
      </div>
    </div>
  );
}
