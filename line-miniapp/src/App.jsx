import React, { useEffect, useRef, useState } from "react";
import { initLiff } from "./liff/init.js";

import HomePage from "./pages/Home.jsx";
import SplashPage from "./pages/splash.jsx";
import CarryProfilePage from "./pages/CarryProfilePage.jsx";

import { useGeolocation } from "./hook/useGeolocation.js";

function FullScreenMessage({ title, message, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-xs text-center">
        {title && (
          <p className="text-sm mb-2 text-slate-700 font-medium">{title}</p>
        )}
        {message && (
          <p className="text-xs mb-4 text-slate-600 whitespace-pre-line">
            {message}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-700">กำลังเชื่อมต่อกับ LINE…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <FullScreenMessage title="เกิดข้อผิดพลาด" message={message}>
      <button
        className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs"
        onClick={() => window.location.reload()}
      >
        ลองใหม่
      </button>
    </FullScreenMessage>
  );
}

function NoProfileScreen() {
  return <FullScreenMessage message="ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้" />;
}

function RoleSelectionScreen({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center">
      <div className="w-full max-w-xs text-center">
        <p className="text-sm mb-4 text-slate-600">คุณต้องการทำอะไร?</p>

        <button
          className="w-full h-10 bg-emerald-500 text-white rounded-xl text-sm mb-3 active:scale-95"
          onClick={() => onSelectRole("requester")}
        >
          ขอความช่วยเหลือ (Requester)
        </button>

        <button
          className="w-full h-10 bg-slate-800 text-white rounded-xl text-sm active:scale-95"
          onClick={() => onSelectRole("solver")}
        >
          ฉันพร้อมช่วย (Solver)
        </button>
      </div>
    </div>
  );
}

// Main App

function App() {
  const [profile, setProfile] = useState(null);
  const [idToken, setIdToken] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [role, setRole] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoom, setInitialRoom] = useState(null);

  const [user, setUser] = useState(null);
  const [needsCarryProfile, setNeedsCarryProfile] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const initCalledRef = useRef(false);

  // Geo location
  const {
    geo,
    error: geoError,
    loading: geoLoading,
  } = useGeolocation(!!profile?.userId);

  // Splash screen 3 วินาทีแรก
  useEffect(() => {
    const timeoutId = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  // เริ่มต้น LIFF + auth/enter
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    async function init() {
      try {
        setLoading(true);
        setErrorMsg("");

        const liff = await initLiff();

        // ยังไม่ login → ส่งไปหน้า login ของ LINE
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // ดึง profile + ID token จาก LIFF
        const prof = await liff.getProfile();
        const token = liff.getIDToken();

        setProfile({
          displayName: prof.displayName,
          userId: prof.userId,
          pictureUrl: prof.pictureUrl,
          statusMessage: prof.statusMessage,
        });
        setIdToken(token);

        // อ่าน roomId / bubbleId จาก URL 
        const params = new URLSearchParams(window.location.search);
        const roomIdFromUrl = params.get("roomId") || null;
        const bubbleIdFromUrl = params.get("bubbleId") || null;
        // const roleFromUrl = params.get("role");

        // if (roleFromUrl === "solver") {
        //   setRole("solver");
        // }

        if (roomIdFromUrl) {
          setInitialRoom({
            roomId: roomIdFromUrl,
            bubbleId: bubbleIdFromUrl,
          });
        }

        // แจ้ง backend ว่ามีผู้ใช้เข้าแอป (auth/enter)
        const resp = await fetch(`${API_BASE}/api/auth/enter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            line_id: prof.userId,
            display_name: prof.displayName,
            avatar_url: prof.pictureUrl,
            // หมายเหตุ: ตอน init ครั้งแรก geo อาจยังไม่มี → ส่ง null ได้
            location: geo,
          }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.message || "auth/enter ล้มเหลว");
        }

        const userFromBackend = await resp.json();
        setUser(userFromBackend);

        const hasCarryProfile =
          Boolean(userFromBackend?.carry_profile) ||
          userFromBackend?.carry_profile_completed === true;

        setNeedsCarryProfile(!hasCarryProfile);
      } catch (err) {
        console.error("init LIFF error:", err);
        setErrorMsg(err.message || "init LIFF ล้มเหลว");
      } finally {
        setLoading(false);
      }
    }

    init();
    // ไม่ใส่ geo ใน dependency เพื่อไม่ให้ init ถูกเรียกซ้ำเมื่อ geo เปลี่ยน
  }, [API_BASE]);

  // ว่าพร้อมช่วย เมื่อเลือก role
  async function setReady(lineId, isReady, location) {
    if (!lineId) return;

    try {
      await fetch(`${API_BASE}/api/auth/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_id: lineId,
          is_ready: isReady,
          location: location || null,
        }),
      });
    } catch (err) {
      console.error("setReady error:", err);
    }
  }

  const handleSelectRole = async (nextRole) => {
    setRole(nextRole);
    await setReady(profile.userId, true, geo);
  };

  // Render branches

  if (showSplash) {
    return <SplashPage />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (errorMsg) {
    return <ErrorScreen message={errorMsg} />;
  }

  if (!profile) {
    return <NoProfileScreen />;
  }

  if (needsCarryProfile) {
    return (
      <CarryProfilePage
        lineId={profile.userId}
        onCompleted={(carryProfile) => {
          setNeedsCarryProfile(false);
          setUser((prev) =>
            prev ? { ...prev, carry_profile: carryProfile } : prev
          );
        }}
      />
    );
  }

  if (!role) {
    return <RoleSelectionScreen onSelectRole={handleSelectRole} />;
  }

  return (
    <HomePage
      profile={profile}
      idToken={idToken}
      role={role}
      initialRoom={initialRoom}
      geo={geo}
      geoError={geoError}
      geoLoading={geoLoading}
    />
  );
}

export default App;
