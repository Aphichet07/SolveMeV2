import bubbleService from "../services/bubble.sevice.js"
import callService from "../services/callai.service.js";


const bubbleController = {
    GetBubbles: async (req, res) => {
        try {
            const userId = req.query.userId || null;
            const location = null;

            const bubbles = await bubbleService.getBubbles(userId, location);

            return res.json(bubbles);
        } catch (err) {
            console.error("Error in GetBubbles:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    CreateBubble: async (req, res) => {
        try {
            const { title, description, expiresInMinutes, userId, location } = req.body;
            console.log("Body : ", req.body)


            if (!title || !description || !expiresInMinutes || !userId) {
                return res.status(400).json({
                    message: "title, description, expiresInMinutes, userId จำเป็นต้องมี",
                })
            }

            let setpriority = "MEDIUM";
            try {
                const { priority } = await callService.getPriority(description);
                setpriority = priority;
            } catch (err) {
                console.error("AI priority failed, fallback MEDIUM:", err.message);
            }

            const bubble = await bubbleService.createBubble(title, description, expiresInMinutes, userId, location, setpriority)
            res.status(200).json(bubble)

        } catch (err) {
            console.log("Error : ", err)
            res.status(500).json({ message: "Internal server error" })
        }
    },
    Nearby: async (req, res) => {
        try {
            const lat = parseFloat(req.query.lat);
            const lon = parseFloat(req.query.lon);
            const radius =
                req.query.radiusMeters !== undefined
                    ? parseFloat(req.query.radiusMeters)
                    : 70;

            if (isNaN(lat) || isNaN(lon)) {
                return res
                    .status(400)
                    .json({ message: "lat และ lon ต้องเป็นตัวเลข" });
            }

            const items = await bubbleService.getNearbyBubbles(lat, lon, radius);
            return res.json(items);
        } catch (err) {
            console.error("Nearby error:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteBubble: async (req, res) => {
        try {
            const bubbleId = req.body
            if (!bubbleId) {
                res.status(500).json({ message: "Kuy" })
            }

            const bubble = await bubbleService.deleteBubble
            res.status(200).json({ message: "Deleted" })
        } catch (err) {
            console.log("Error : ", err)
            res.status(500).json({ message: "Internal server error" })
        }
    },

    editBubble: async (req, res) => {
        try {
            const { bubbleid, title, dest } = req.body
            if (!bubbleid || !title || !dest) {
                res.status(500).json({ message: "Kuy" })
            }

            const bubble = await bubbleService.
                res.status(200).json({ messsage: "Edit success", bubble: bubble })
        } catch (err) {
            console.log("Internal server error")
            res.status(500)
        }
    },
    MatchStatus: async (req, res) => {
        try {
            const { bubbleId } = req.params;

            const result = await matchService.findOrCreateMatchForBubble(bubbleId);
            // result = { status, requesterId, solverId, match, solver? }


            if (result.status === "MATCHED") {
                return res.json({
                    status: "MATCHED",
                    requesterId: result.requesterId,
                    solverId: result.solverId,
                    solver: result.solver
                        ? {
                            id: result.solver.line_id || result.solver.id,
                            name: result.solver.display_name || "Solver",
                            avatar_url: result.solver.avatar_url || null,
                        }
                        : null,
                });
            }


            if (result.status === "SEARCHING") {
                return res.json({
                    status: "SEARCHING",
                    requesterId: result.requesterId,
                    solverId: null,
                    solver: null,
                });
            }


            return res.json({
                status: result.status || "SEARCHING",
                requesterId: result.requesterId,
                solverId: result.solverId || null,
                solver: null,
            });
        } catch (err) {
            console.error("MatchStatus error:", err);
            return res.status(500).json({
                status: "ERROR",
                message: "Internal server error",
            });
        }
    },
    async getMatchStatus(req, res) {
        try {
            const { bubbleId } = req.params;
            const result = await bubbleService.getMatchStatus(bubbleId);

            if (!result.ok) {
                if (result.reason === "NOT_FOUND") {
                    return res
                        .status(404)
                        .json({ status: "ERROR", message: "Bubble not found" });
                }
                return res
                    .status(200)
                    .json({ status: "ERROR", message: "Unknown error" });
            }

            return res.json(result.data);
        } catch (err) {
            console.error("getMatchStatus error:", err);
            return res
                .status(500)
                .json({ status: "ERROR", message: "Internal server error" });
        }
    },

    async getActiveSolvers(req, res) {
        try {
            const { bubbleId } = req.query;
            const solvers = await bubbleService.getActiveSolversAroundBubble(bubbleId);
            return res.json(solvers);
        } catch (err) {
            console.error("getActiveSolvers error:", err);
            return res.status(500).json({ message: "Internal error" });
        }
    },
}

export default bubbleController 