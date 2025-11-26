// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { initLiff } from "./liff/init.js";
import HomePage from "./pages/Home.jsx";
import SplashPage from "./pages/splash.jsx";
import { useGeolocation } from "./hook/useGeolocation.js";

function App() {
  const [profile, setProfile] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [role, setRole] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  // const [geo, setGeo] = useState(null);
  const [initialRoom, setInitialRoom] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const initCalledRef = useRef(false);
  const watchIdRef = useRef(null);

  // Splash 3 วิ
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // init LIFF + auth/enter
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    async function init() {
      try {
        setLoading(true);
        setErrorMsg("");

        const liff = await initLiff();

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const prof = await liff.getProfile();
        const token = liff.getIDToken();

        console.log("LIFF profile:", prof);

        setProfile({
          displayName: prof.displayName,
          userId: prof.userId,
          pictureUrl: prof.pictureUrl,
          statusMessage: prof.statusMessage,
        });
        setIdToken(token);

        // อ่าน roomId จาก URL
        const params = new URLSearchParams(window.location.search);
        const roomIdFromUrl = params.get("roomId") || null;
        const bubbleIdFromUrl = params.get("bubbleId") || null;

        if (roomIdFromUrl) {
          console.log("✨ initialRoom from URL =", {
            roomId: roomIdFromUrl,
            bubbleId: bubbleIdFromUrl,
          });
          setInitialRoom({
            roomId: roomIdFromUrl,
            bubbleId: bubbleIdFromUrl,
          });
        }

        const resp = await fetch(`${API_BASE}/api/auth/enter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            line_id: prof.userId,
            display_name: prof.displayName,
            avatar_url: prof.pictureUrl
          }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.message || "auth/enter ล้มเหลว");
        }

        const userFromBackend = await resp.json();
        console.log("user from backend:", userFromBackend);
      } catch (err) {
        console.error("init LIFF error:", err);
        setErrorMsg(err.message || "init LIFF ล้มเหลว");
      } finally {
        setLoading(false);
      }
    }


    init();
  }, [API_BASE]);

  useEffect(() => {
    if (initialRoom && !role) {
      setRole("solver");
    }
  }, [initialRoom, role]);

  const { geo, error: geoError, loading: geoLoading } = useGeolocation(
    !!profile?.userId   // enabled = true/false
  );
  // useEffect(() => {
  //   if (!profile?.userId) return;

  //   if (!navigator.geolocation) {
  //     console.warn("อุปกรณ์ไม่รองรับ geolocation");
  //     return;
  //   }

  //   // ขอครั้งแรก (จะขึ้น popup ที่นี่)
  //   navigator.geolocation.getCurrentPosition(
  //     (pos) => {
  //       const firstGeo = {
  //         lat: pos.coords.latitude,
  //         lon: pos.coords.longitude,
  //       };
  //       console.log("📍 first position:", firstGeo);
  //       setGeo(firstGeo);
  //     },
  //     (err) => {
  //       console.warn("Geo error:", err.code, err.message);
  //     }
  //   );

  //   const watchId = navigator.geolocation.watchPosition(
  //     (pos) => {
  //       const newGeo = {
  //         lat: pos.coords.latitude,
  //         lon: pos.coords.longitude,
  //       };
  //       console.log("📍 new position:", newGeo);
  //       setGeo(newGeo);
  //     },
  //     (err) => {
  //       console.warn("Geo watch error:", err);
  //       // debug เพิ่ม
  //       console.warn("code =", err.code, "msg =", err.message);
  //     },
  //     {
  //       enableHighAccuracy: false,
  //       maximumAge: 10000,
  //       timeout: 30000,
  //     }
  //   );

  //   watchIdRef.current = watchId;

  //   return () => {
  //     if (watchIdRef.current != null) {
  //       navigator.geolocation.clearWatch(watchIdRef.current);
  //     }
  //   };
  // }, [profile?.userId]);

  async function setReady(lineId, isReady, location) {
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

    // ถ้ายังไม่มี geo เลย ก็ส่งไปแบบ null 
    await setReady(profile.userId, true, geo);
  };


  if (showSplash) return <SplashPage />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-700">กำลังเชื่อมต่อกับ LINE…</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-xs text-center">
          <p className="text-sm text-red-600 mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-xs text-slate-600 mb-4">{errorMsg}</p>
          <button
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs"
            onClick={() => window.location.reload()}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-700">
          ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้
        </p>
      </div>
    );
  }

  if (!role) {
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

  return (
    <HomePage
      profile={profile}
      idToken={idToken}
      role={role}
      initialRoom={initialRoom}
      geo={geo}  
    />
  );

}

export default App;


// // src/App.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { initLiff } from "./liff/init.js";
// import HomePage from "./pages/Home.jsx";
// import SplashPage from "./pages/splashpage.jsx";

// function App() {
//   const [profile, setProfile] = useState(null);
//   const [idToken, setIdToken] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [role, setRole] = useState(null);
//   const [showSplash, setShowSplash] = useState(true);
//   const [geo, setGeo] = useState(null);
//   const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
//   const initCalledRef = useRef(false);


//   const watchIdRef = useRef(null);
//   useEffect(() => {
//     if (!profile?.userId) return;

//     if (!navigator.geolocation) {
//       console.warn("อุปกรณ์ไม่รองรับ geolocation");
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         setGeo({
//           lat: pos.coords.latitude,
//           lon: pos.coords.longitude,
//         });
//       },
//       (err) => {
//         console.warn("Geo error:", err);
//       }
//     );
//   }, [profile?.userId]);


//   useEffect(() => {
//     if (!profile?.userId) return;

//     if (!navigator.geolocation) {
//       console.warn("อุปกรณ์ไม่รองรับ geolocation");
//       return;
//     }

//     const watchId = navigator.geolocation.watchPosition(
//       (pos) => {
//         const newGeo = {
//           lat: pos.coords.latitude,
//           lon: pos.coords.longitude,
//         };
//         console.log("📍 new position:", newGeo);
//         setGeo(newGeo);
//       },
//       (err) => {
//         console.warn("Geo watch error:", err);
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 5000,
//         timeout: 10000,
//       }
//     );

//     watchIdRef.current = watchId;

//     return () => {
//       if (watchIdRef.current != null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//     };
//   }, [profile?.userId]);


//   useEffect(() => {
//     const t = setTimeout(() => {
//       setShowSplash(false);
//     }, 3000);

//     return () => clearTimeout(t);
//   }, []);

//   useEffect(() => {
//     if (initCalledRef.current) return;
//     initCalledRef.current = true;

//     async function init() {
//       try {
//         setLoading(true);
//         setErrorMsg("");

//         const liff = await initLiff();

//         if (!liff.isLoggedIn()) {
//           liff.login();
//           return;
//         }

//         const prof = await liff.getProfile();
//         const token = liff.getIDToken();

//         console.log("LIFF profile:", prof);

//         setProfile({
//           displayName: prof.displayName,
//           userId: prof.userId,
//           pictureUrl: prof.pictureUrl,
//           statusMessage: prof.statusMessage,
//         });
//         setIdToken(token);

//         const resp = await fetch(`${API_BASE}/api/auth/enter`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             line_id: prof.userId,
//             display_name: prof.displayName,
//             avatar_url: prof.pictureUrl,
//           }),
//         });

//         if (!resp.ok) {
//           const data = await resp.json().catch(() => ({}));
//           throw new Error(data.message || "auth/enter ล้มเหลว");
//         }

//         const userFromBackend = await resp.json();
//         console.log("user from backend:", userFromBackend);
//       } catch (err) {
//         console.error("init LIFF error:", err);
//         setErrorMsg(err.message || "init LIFF ล้มเหลว");
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [API_BASE]);

//   async function setReady(lineId, isReady) {
//     try {
//       await fetch(`${API_BASE}/api/auth/ready`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           line_id: lineId,
//           is_ready: isReady,
//           location: geo || null,
//         }),
//       });
//     } catch (err) {
//       console.error("setReady error:", err);
//     }
//   }


//   if (showSplash) {
//     return <SplashPage />;
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
//           <p className="text-sm text-slate-700">กำลังเชื่อมต่อกับ LINE…</p>
//         </div>
//       </div>
//     );
//   }

//   if (errorMsg) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <div className="max-w-xs text-center">
//           <p className="text-sm text-red-600 mb-2">เกิดข้อผิดพลาด</p>
//           <p className="text-xs text-slate-600 mb-4">{errorMsg}</p>
//           <button
//             className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs"
//             onClick={() => window.location.reload()}
//           >
//             ลองใหม่
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <p className="text-sm text-slate-700">
//           ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้
//         </p>
//       </div>
//     );
//   }

//   if (!role) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex justify-center items-center">
//         <div className="w-full max-w-xs text-center">
//           <p className="text-sm mb-4 text-slate-600">คุณต้องการทำอะไร?</p>

//           {/* <button
//             className="w-full h-10 bg-emerald-500 text-white rounded-xl text-sm mb-3 active:scale-95"
//             onClick={async () => {
//               setRole("requester");
//               await setReady(profile.userId, true);
//             }}
//           >
//             ขอความช่วยเหลือ (Requester)
//           </button>

//           <button
//             className="w-full h-10 bg-slate-800 text-white rounded-xl text-sm active:scale-95"
//             onClick={async () => {
//               setRole("solver");
//               await setReady(profile.userId, true);
//             }}
//           >
//             ฉันพร้อมช่วย (Solver)
//           </button> */}

//           <button
//             className="w-full h-10 bg-emerald-500 text-white rounded-xl text-sm mb-3 active:scale-95"
//             onClick={() => {
//               setRole("requester");
//             }}
//           >
//             ขอความช่วยเหลือ (Requester)
//           </button>

//           <button
//             className="w-full h-10 bg-slate-800 text-white rounded-xl text-sm active:scale-95"
//             onClick={() => {
//               setRole("solver");
//             }}
//           >
//             ฉันพร้อมช่วย (Solver)
//           </button>

//         </div>
//       </div>
//     );
//   }

//   return (
//     <HomePage
//       profile={profile}
//       idToken={idToken}
//       role={role}
//     />
//   );
// }

// export default App;
