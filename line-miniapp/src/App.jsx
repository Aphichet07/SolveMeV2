import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { initLiff } from "./liff/init.js";

import HomePage from "./pages/Home.jsx";
import SplashPage from "./pages/splash.jsx";
import CarryProfilePage from "./pages/CarryProfilePage.jsx";
import ChatPage from "./pages/chat.jsx"
import CreateBubblePage from "./pages/createBubble.jsx"
import ProfilePage from "./pages/profile.jsx"
import WaitingForSolverPage from "./pages/waiting.jsx"
import WalletPage from "./pages/wallet.jsx"
import TipPage from "./pages/tipPage.jsx"
import { useGeolocation } from "./hook/useGeolocation.js";

const AppContext = createContext();

export const useApp = () => useContext(AppContext);


function FullScreenMessage({ title, message, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-xs text-center">
        {title && <p className="text-sm mb-2 text-slate-700 font-medium">{title}</p>}
        {message && <p className="text-xs mb-4 text-slate-600 whitespace-pre-line">{message}</p>}
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

function RoleSelectionScreen() {
  const { setRole, profile, geo, API_BASE } = useApp();
  const navigate = useNavigate();

  const handleSelectRole = async (selectedRole) => {
    setRole(selectedRole);
    // แจ้ง Backend ว่าพร้อม (Logic เดิม)
    try {
      await fetch(`${API_BASE}/api/auth/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_id: profile.userId,
          is_ready: true,
          location: geo || null,
        }),
      });
    } catch (err) {
      console.error("setReady error:", err);
    }
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center">
      <div className="w-full max-w-xs text-center">
        <p className="text-sm mb-4 text-slate-600">คุณต้องการทำอะไร?</p>
        <button
          className="w-full h-10 bg-emerald-500 text-white rounded-xl text-sm mb-3 active:scale-95"
          onClick={() => handleSelectRole("requester")}
        >
          ขอความช่วยเหลือ (Requester)
        </button>
        <button
          className="w-full h-10 bg-slate-800 text-white rounded-xl text-sm active:scale-95"
          onClick={() => handleSelectRole("solver")}
        >
          ฉันพร้อมช่วย (Solver)
        </button>
      </div>
    </div>
  );
}

// --- 3. Main Route Container ---
function AppRoutes() {
  const { 
    loading, errorMsg, profile, user, 
    needsCarryProfile, role, showSplash,
    initialRoom 
  } = useApp();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect Logic
  useEffect(() => {
    if (loading || showSplash || errorMsg) return;

    if (needsCarryProfile) {
      navigate("/create-profile", { replace: true });
      return;
    }

    // ถ้ายังไม่เลือก Role -> ไปหน้า select-role
    // (ยกเว้นกรณีมี initialRoom จาก URL อาจจะข้ามไป home เลยก็ได้ แล้วแต่ Logic แต่ที่นี้ให้เลือกก่อน)
    if (!role && !initialRoom) { 
      navigate("/select-role", { replace: true });
      return;
    }

    if (window.location.pathname === '/') {
        navigate("/home", { replace: true });
    }

  }, [loading, showSplash, errorMsg, needsCarryProfile, role, initialRoom, navigate]);


  if (showSplash) return <SplashPage />;
  if (loading) return <LoadingScreen />;
  if (errorMsg) return <FullScreenMessage title="เกิดข้อผิดพลาด" message={errorMsg} />;
  if (!profile) return <FullScreenMessage message="ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้" />;

  return (
    <Routes>
      <Route path="/create-profile" element={<CarryProfilePageWrapper />} />
      <Route path="/select-role" element={<RoleSelectionScreen />} />
      <Route path="/home/*" element={<HomePageWrapper />} />
      {/* Fallback */}
      <Route path="*" element={<LoadingScreen />} />
    </Routes>
  );
}

// Wrapper เพื่อเชื่อม Props เดิมเข้ากับ Router
function CarryProfilePageWrapper() {
  const { profile, setUser, setNeedsCarryProfile } = useApp();
  const navigate = useNavigate();

  return (
    <CarryProfilePage
      lineId={profile?.userId}
      onCompleted={(carryProfile) => {
        setNeedsCarryProfile(false);
        setUser((prev) => (prev ? { ...prev, carry_profile: carryProfile } : prev));
        navigate("/select-role"); 
      }}
    />
  );
}

function HomePageWrapper() {
  const { profile, idToken, role, initialRoom, geo, geoError, geoLoading } = useApp();
  // HomePage สามารถดึง query params เองได้ หรือรับผ่าน props แบบเดิม
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

// --- 4. Root App Component (Provider & Init Logic) ---

function AppProvider({ children }) {
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
  const { geo, error: geoError, loading: geoLoading } = useGeolocation(!!profile?.userId);

  // Splash logic
  useEffect(() => {
    const timeoutId = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Init LIFF
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    async function init() {
      try {
        setLoading(true);
        const liff = await initLiff();

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const prof = await liff.getProfile();
        const token = liff.getIDToken();

        setProfile({
          displayName: prof.displayName,
          userId: prof.userId,
          pictureUrl: prof.pictureUrl,
          statusMessage: prof.statusMessage,
        });
        setIdToken(token);

        // Check URL Params สำหรับ Deep link (roomId)
        const params = new URLSearchParams(window.location.search);
        const roomIdFromUrl = params.get("roomId");
        const bubbleIdFromUrl = params.get("bubbleId");
        
        if (roomIdFromUrl) {
          setInitialRoom({ roomId: roomIdFromUrl, bubbleId: bubbleIdFromUrl });
        }

        // Auth/Enter API
        const resp = await fetch(`${API_BASE}/api/auth/enter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            line_id: prof.userId,
            display_name: prof.displayName,
            avatar_url: prof.pictureUrl,
            location: null, // Geo จะมาทีหลัง
          }),
        });

        if (!resp.ok) throw new Error("Auth failed");
        
        const userFromBackend = await resp.json();
        setUser(userFromBackend);

        const hasCarryProfile = Boolean(userFromBackend?.carry_profile) || userFromBackend?.carry_profile_completed === true;
        setNeedsCarryProfile(!hasCarryProfile);

      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "Init failed");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [API_BASE]);

  const value = {
    profile, setProfile,
    idToken, setIdToken,
    loading, errorMsg,
    role, setRole,
    showSplash,
    initialRoom,
    user, setUser,
    needsCarryProfile, setNeedsCarryProfile,
    geo, geoError, geoLoading,
    API_BASE
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;