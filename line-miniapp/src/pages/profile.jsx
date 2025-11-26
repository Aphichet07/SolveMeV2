import React, { useState } from "react";
import FooterNav from "../components/footer.jsx";
import HomePage from "./Home.jsx";
import WalletPage from "./wallet.jsx";
import CreateBubblePage from "./createBubble.jsx";
import WaitingForSolverPage from "./waiting.jsx";
import { useEffect } from "react";

export default function ProfilePage({ profile, onBack }) {
  const [view, setView] = useState("profile");
  const [currentBubble, setCurrentBubble] = useState(null);


  useEffect(() =>{
    async function CallInfo(){
       const res = await fetch(
          `${API_BASE}/api/state/getState`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify( )
          }
        );
    }
  })



  if (view === "home") {
    return (
      <>
        <HomePage />
        <FooterNav
          onHomeClick={() => setView("home")}
          onPlusClick={() => setView("create")}
          onProfileClick={() => setView("profile")}
          onWalletClick={() => setView("wallet")}
        />
      </>
    );
  }

  if (view === "wallet") {
    return (
      <>
        <WalletPage onBack={() => setView("home")} />
        <FooterNav
          onHomeClick={() => setView("home")}
          onPlusClick={() => setView("create")}
          onProfileClick={() => setView("profile")}
          onWalletClick={() => setView("wallet")}
        />
      </>
    );
  }

  if (view === "create") {
    return (
      <>
        <CreateBubblePage
          profile={profile}
          onBack={() => setView("home")}
          onCreated={(createdBubble) => {
            setCurrentBubble(createdBubble);
            setView("waiting");
          }}
        />
        <FooterNav
          onHomeClick={() => setView("home")}
          onPlusClick={() => setView("create")}
          onProfileClick={() => setView("profile")}
          onWalletClick={() => setView("wallet")}
        />
      </>
    );
  }

  if (view === "waiting") {
    return (
      <>
        <WaitingForSolverPage
          bubble={currentBubble}
          onBack={() => setView("home")}
          onMatched={({ bubble, matchId, solver }) => {
            console.log("Matched!", { bubble, matchId, solver });
            setView("home");
          }}
        />
        <FooterNav
          onHomeClick={() => setView("home")}
          onPlusClick={() => setView("create")}
          onProfileClick={() => setView("profile")}
          onWalletClick={() => setView("wallet")}
        />
      </>
    );
  }

  if (!profile) {
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
                โปรไฟล์
              </span>
            </div>
          </header>

          <main className="flex-1 px-4 pt-4 pb-24 flex items-center justify-center">
            <p className="text-xs text-slate-500">
              ยังไม่มีข้อมูลโปรไฟล์ที่ส่งเข้ามา
            </p>
          </main>
        </div>

        <FooterNav
          onHomeClick={() => setView("home")}
          onPlusClick={() => setView("create")}
          onProfileClick={() => setView("profile")}
          onWalletClick={() => setView("wallet")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-md flex flex-col">

        <header className="bg-white mb-10">
          <div className="px-5 pt-6 pb-2">
            <p className="text-4xl font-extrabold tracking-[0.12em] text-[#06c755]">
              PROFILE
            </p>
          </div>
        </header>


        <main className="flex-1 px-4 pt-2 pb-28">

          <div className="relative mt-4 bg-white rounded-3xl border border-slate-100 shadow-[0_10px_35px_rgba(15,23,42,0.12)] px-5 pt-12 pb-6 flex flex-col items-center">

            {profile.pictureUrl && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-[3px] border-white shadow-[0_8px_18px_rgba(15,23,42,0.25)] overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={profile.pictureUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mt-2 text-center">
              <p className="text-[13px] font-semibold text-slate-900">
                Name : {profile.displayName || "ไม่ทราบชื่อ"}
              </p>
              {profile.userId && (
                <p className="text-[11px] text-slate-600 mt-1">
                  Line ID : {profile.userId}
                </p>
              )}
            </div>

            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-700">
              <span className="font-semibold">
                {profile.tier || "Silver"}
              </span>
              <span className="ml-1 text-[9px] text-slate-500">◎</span>
            </div>

            <div className="mt-4 w-full flex justify-between text-[11px] text-slate-700">
              <span>
                ช่วยเหลือไปแล้ว :{" "}
                <span className="font-semibold text-emerald-600">
                  {profile.total_solves ?? profile.total_solves ?? 0}
                </span>
              </span>
              <span>
                ร้องขอไปแล้ว :{" "}
                <span className="font-semibold text-amber-600">
                  {profile.total_requests ?? profile.total_requests ?? 0}
                </span>
              </span>
            </div>

            <div className="mt-4 w-full h-px bg-slate-200" />

            <div className="mt-3 w-full">
              <p className="text-[13px] font-semibold text-slate-900 mb-2">
                History
              </p>

              {Array.isArray(profile.history) && profile.history.length > 0 ? (
                <div className="space-y-2">
                  {profile.history.map((h, idx) => {
                    const isHelp = h.type === "help";
                    return (
                      <div key={h.id || idx} className="text-[11px] leading-snug">
                        <p
                          className={`font-semibold ${isHelp ? "text-emerald-600" : "text-amber-600"
                            }`}
                        >
                          {isHelp ? "ช่วยเหลือ :" : "ร้องขอ :"} {h.title}
                        </p>
                        {h.detail && (
                          <p className="text-slate-700">
                            รายละเอียด : {h.detail}
                          </p>
                        )}
                        {h.points && (
                          <p className="mt-0.5 text-[10px] text-emerald-600 font-semibold">
                            {h.points}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  ยังไม่มีประวัติการช่วยเหลือ / ร้องขอ
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      <FooterNav
        onHomeClick={() => setView("home")}
        onPlusClick={() => setView("create")}
        onProfileClick={() => setView("profile")}
        onWalletClick={() => setView("wallet")}
      />
    </div>
  );
}
