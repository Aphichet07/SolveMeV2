import { admin, db } from "../firebase/admin.js"
import axios from "axios";

const AI_BASE_URL = "http://localhost:8001/api/priority";


const callService = {
    // ส่ง bubble และ candidate คนที่ใกล้ที่สุดไป 10 คน return ค่าความน่าจะเป็นของทั้ง 10 ตน
    getScoreMatching: async (bubble, candidate) => {




        const res = await axios.post(
            `${AI_BASE_URL}/api/matching/rank`,
            payload,
            { timeout: 5000 }
        );

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

    getDescribe: async () => {

    }
    ,

    getTranslate: async () => {

    }
}

export default callService
