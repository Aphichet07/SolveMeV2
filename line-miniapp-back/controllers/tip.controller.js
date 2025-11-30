import tipService from "../services/tip.service.js";
import lineService from "../services/notify.service.js";
import axios from "axios";

const tipController = {
  async sendTip(req, res) {
    try {
      const { match_id, bubble_id, from_user_id, to_user_id, amount } =
        req.body || {};

      if (!match_id || !from_user_id || !to_user_id || !amount) {
        return res.status(400).json({
          message: "match_id, from_user_id, to_user_id, amount จำเป็นต้องมี",
        });
      }

      const tip = await tipService.createTip({
        match_id,
        bubble_id,
        from_user_id,
        to_user_id,
        amount,
      });

      try {
        await lineService.sendTipNotificationToSolver({
          solverLineId: to_user_id,
          amount,
        });
      } catch (err) {
        console.warn("[TIP] sendTipNotification error:", err.message);
      }

      return res.json({ ok: true, tip });
    } catch (err) {
      console.error("sendTip error:", err);
      return res.status(500).json({
        ok: false,
        message: err.message || "Internal server error",
      });
    }
  },

  //   POST /api/tip/create-session
  async createTipSession(req, res) {
    try {
      const { match_id, bubble_id, from_user_id, to_user_id, amount } =
        req.body;

      const tip = await tipService.createPendingTip({
        match_id,
        bubble_id,
        from_user_id,
        to_user_id,
        amount,
      });

      const linePayBody = {
        productName: "SolveMe Tip",
        amount: Number(amount),
        currency: "THB",
        orderId: tip.id,
        confirmUrl: `${process.env.API_BASE_URL}/api/tip/linepay/confirm`,
        cancelUrl: `${process.env.APP_LIFF_URL}?cancelTip=1`,
      };

      const lineRes = await axios.post(
        `${LINEPAY_API_BASE}/payments/request`,
        linePayBody,
        {
          headers: {
            "X-LINE-ChannelId": process.env.LINEPAY_CHANNEL_ID,
            "X-LINE-ChannelSecret": process.env.LINEPAY_CHANNEL_SECRET,
          },
        }
      );

      const { transactionId, paymentUrl } = lineRes.data.info;

      await tipService.attachTransactionId(tip.id, transactionId);

      return res.json({
        ok: true,
        paymentUrl: paymentUrl.web,
      });
    } catch (err) {
      console.error("createTipSession error:", err.response?.data || err);
      return res
        .status(500)
        .json({ ok: false, message: "create tip session failed" });
    }
  },

//   GET /api/tip/linepay/confirm
  async confirmLinePay(req, res) {
    try {
      const { transactionId } = req.query;
      if (!transactionId) {
        return res.status(400).send("missing transactionId");
      }

      const confirmRes = await axios.post(
        `${LINEPAY_API_BASE}/payments/${transactionId}/confirm`,
        {
          amount: 20,
          currency: "THB",
        },
        {
          headers: {
            "X-LINE-ChannelId": process.env.LINEPAY_CHANNEL_ID,
            "X-LINE-ChannelSecret": process.env.LINEPAY_CHANNEL_SECRET,
          },
        }
      );

      await tipService.markPaidByTransactionId(transactionId);

      return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 40px;">
          <h2>ชำระเงินสำเร็จ</h2>
          <p>ขอบคุณที่ให้ทิปผู้ช่วยของคุณ</p>
          <p>คุณสามารถปิดหน้านี้แล้วกลับไปยังห้องแชทได้เลย</p>
        </body>
      </html>
    `);
    } catch (err) {
      console.error("confirmLinePay error:", err.response?.data || err);
      return res.status(500).send("payment failed");
    }
  },
};

export default tipController;
