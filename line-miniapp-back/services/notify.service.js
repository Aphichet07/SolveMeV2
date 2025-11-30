import * as line from "@line/bot-sdk";

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANAL_ACCESS_TOKEN,
});

const LIFF_URL =
  process.env.LIFF_URL || "https://miniapp.line.me/2008545281-9GrjpXG7";

async function sendMatchNotificationToSolver({ solverLineId, roomId, bubble }) {
  if (!solverLineId) {
    console.warn("No solverLineId provided to sendMatchNotificationToSolver");
    return;
  }

  const bubbleId = bubble?.id;
  const deepLink = `${LIFF_URL}?roomId=${encodeURIComponent(
    roomId
  )}&bubbleId=${encodeURIComponent(bubbleId || "")}`;

  console.log("Link : ", deepLink);
  console.log("[LINE PUSH] to       =", solverLineId);
  console.log("[LINE PUSH] roomId   =", roomId);
  console.log("[LINE PUSH] bubbleId =", bubbleId);
  console.log("[LINE PUSH] url      =", deepLink);

  try {
    await client.pushMessage({
      to: solverLineId,
      messages: [
        {
          type: "flex",
          altText: "SolveMe: คุณได้รับคำขอช่วยเหลือใหม่",
          contents: {
            type: "bubble",
            size: "kilo",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "📢 คุณได้รับคำขอช่วยเหลือ",
                  weight: "bold",
                  color: "#FFFFFF",
                  size: "md",
                  align: "center",
                },
              ],
              paddingAll: "15px",
              backgroundColor: "#06bc50",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "SolveMe",
                  weight: "bold",
                  size: "sm",
                  color: "#aaaaaa",
                  margin: "none",
                },
                {
                  type: "text",
                  // Corrected: Removed template literal string for cleaner JSON
                  text: bubble?.title?.slice(0, 40) || "มีคนต้องการความช่วยเหลือใกล้คุณ",
                  weight: "bold",
                  size: "lg",
                  wrap: true,
                  margin: "md",
                },
                {
                  type: "text",
                  // Corrected: Removed template literal string for cleaner JSON
                  text: bubble?.description?.slice(0, 60) || "กดปุ่มด้านล่างเพื่อเข้าไปยังห้องแชทและให้ความช่วยเหลือ",
                  size: "sm",
                  color: "#666666",
                  wrap: true,
                  margin: "sm",
                },
              ],
              spacing: "none",
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#06bc50",
                  action: {
                    type: "uri",
                    label: "เข้าไปช่วยเลย",
                    uri: deepLink, 
                  },
                },
              ],
              flex: 0,
              paddingAll: "20px",
              paddingTop: "0px",
            },
          },
        },
      ],
    });

    console.log("[LINE PUSH] success");
  } catch (err) {
    console.error("[LINE PUSH] error status =", err.status);
    console.error("[LINE PUSH] error body   =", err.body);
  }
}

export default {
  sendMatchNotificationToSolver,
};