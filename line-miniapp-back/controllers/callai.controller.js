import callService from "../services/callai.service.js";

const callController = {
    getPriority: async (req, res) => {
        try {
            const { text } = req.body;

            if (!text || typeof text !== "string") {
                return res.status(400).json({ message: "text is required" });
            }

            const { priority, scores } = await callService.getPriority(text);

            return res.json({
                priority,
                scores,
            });
        } catch (err) {
            console.error("classifyPriority error:", err.message);
            return res
                .status(500)
                .json({ message: "Failed to classify priority", error: err.message });
        }
    }
}

export default callController
