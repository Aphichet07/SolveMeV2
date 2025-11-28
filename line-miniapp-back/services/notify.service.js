import * as line from "@line/bot-sdk";

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANAL_ACCESS_TOKEN 
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
  
  console.log("Link : ",deepLink )
  console.log("[LINE PUSH] to       =", solverLineId);
  console.log("[LINE PUSH] roomId   =", roomId);
  console.log("[LINE PUSH] bubbleId =", bubbleId);
  console.log("[LINE PUSH] url      =", deepLink);

  try {
    await client.pushMessage({
      to: solverLineId,
      messages: [
        {
          type: "template",
          altText: "SolveMe: คุณได้รับคำขอช่วยเหลือใหม่",
          template: {
            type: "buttons",
            title: bubble?.title?.slice(0, 40) || "คุณได้รับคำขอช่วยเหลือ",
            text:
              bubble?.description?.slice(0, 60) ||
              "มีคนต้องการความช่วยเหลือใกล้คุณ กดเพื่อเข้าไปยังห้องแชท",
            actions: [
              {
                type: "uri",
                label: "เข้าไปช่วยเลย",
                uri: deepLink, 
              },
            ],
          },
        },
      ],
    });

    console.log("[LINE PUSH] success");
  } catch (err) {
    console.error("[LINE PUSH] error status =", err.status);
    console.error("[LINE PUSH] error body   =", err.body);

  }
}

export default {
  sendMatchNotificationToSolver,
};