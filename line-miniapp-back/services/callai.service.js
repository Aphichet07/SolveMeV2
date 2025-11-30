import { admin, db } from "../firebase/admin.js";
import axios from "axios";

const AI_BASE_URL = "http://localhost:8001/api/priority";

const callService = {
  // ส่ง bubble และ candidate คนที่ใกล้ที่สุดไป 10 คน return ค่าความน่าจะเป็นของทั้ง 10 ตน
  getScoreMatching: async (bubble, candidate) => {
    const res = await axios.post(`${AI_BASE_URL}/api/matching/rank`, payload, {
      timeout: 5000,
    });

    return res.data;
  },

  getPriority: async (text) => {
    if (!text || typeof text !== "string") {
      throw new Error("text is required for priority classification");
    }

    try {
      const res = await axios.post(AI_BASE_URL, { text });

      const { priority, scores } = res.data;

      return {
        priority,
        scores: scores || null,
      };
    } catch (err) {
      console.error("Error calling AI priority service:", err.message);
      throw new Error("AI priority service failed");
    }
  },

  getCategory: async (text) => {
    // TODO: call LLM หรือ model ของคุณจริง ๆ
    // ชั่วคราว: ถ้าเจอคำพวก "โน้ตบุ๊ก, wifi, internet" => TECH เหมือน rule-based
    const lower = (text || "").toLowerCase();

    if (
      lower.includes("โน้ตบุ๊ก") ||
      lower.includes("wifi") ||
      lower.includes("อินเทอร์เน็ต")
    ) {
      return { category: "TECH" };
    }
    if (
      lower.includes("เลือดออก") ||
      lower.includes("ล้ม") ||
      lower.includes("หายใจ")
    ) {
      return { category: "EMERGENCY" };
    }

    return { category: "OTHER" };
  },

  getDescribe: async () => {},
  getTranslate: async () => {},
};

export default callService;
