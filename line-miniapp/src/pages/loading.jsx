import React from "react";
import "../index.css";

export default function LoadingPage() {
    return (
        <div className="w-screen min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center border border-[#bdb9b9] rounded-xl px-10 py-12">
                <div className="text-center">
                    <p className="text-8xl inline-block text-green-400 font-bold">SOLVE</p>
                    <p className="text-xl inline-block text-gray-800">ME</p>
                </div>

                <div className="mt-10 flex items-center justify-center px-4">
                    <button
                        className="border border-black w-6 h-6 bg-white rounded-sm"
                        aria-label="Accept terms"
                    />
                    <p className="ml-4 text-[10px] text-gray-700 max-w-xs">
                        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Labore, facere!
                    </p>
                </div>

                <button
                    className="mt-8 w-[220px] h-10 rounded-xl bg-emerald-400 text-xl font-bold text-amber-50 flex items-center justify-center"
                >
                    Line Login
                </button>
            </div>
        </div>
    );
}
