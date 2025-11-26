import React from "react";
import "../index.css"
import settingsIcon from "../assets/settings.png";
import notificationIcon from "../assets/notification.png";

export default function Header() {
    return (
        <header className="bg-white">
            <div className="h-12 px-4 flex items-center justify-between">
                <div>
                    <span className="text-2xl text-green-400 font-bold">SOLVE</span>
                    <span className="text-sm text-gray-800 font-bold">ME</span>
                </div>

                <div className="flex items-center gap-3">
                    <button>
                        <img src={notificationIcon} alt="noti-icon" className="w-6 h-6" />
                    </button>
                    <button>
                        <img src={settingsIcon} alt="setting-icon" className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
}