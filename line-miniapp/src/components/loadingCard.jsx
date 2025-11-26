import React from "react";
import "../index.css";

export default function LoadingCard() {
    return (
        <div className="w-full rounded-2xl border border-gray-300 py-8 px-6 flex flex-col items-center">
          
            <div className="text-center">
                <p className="text-5xl inline-block text-green-400 font-bold">SOLVE</p>
                <p className="text-base inline-block text-gray-800">ME</p>
            </div>

            <div className="mt-6 flex items-start w-full">
                <button
                    className="border border-black w-5 h-5 bg-white rounded-sm mt-0.5"
                    aria-label="Accept terms"
                />
                <p className="ml-3 text-xs text-gray-700">
                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Labore,
                    facere!
                </p>
            </div>

            <button className="mt-6 w-full h-10 rounded-xl bg-emerald-400 text-base font-bold text-white flex items-center justify-center">
                Line Login
            </button>
        </div>
    );
}
