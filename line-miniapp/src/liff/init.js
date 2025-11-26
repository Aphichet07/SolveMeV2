import liff from "@line/liff";

let liffInitialized = false;

export async function initLiff() {
  if (liffInitialized) return liff;

  const liffId = import.meta.env.VITE_LIFF_ID;
  if (!liffId) {
    throw new Error("VITE_LIFF_ID ยังไม่ถูกตั้งค่าใน .env");
  }

  await liff.init({ liffId });
  liffInitialized = true;
  return liff;
}