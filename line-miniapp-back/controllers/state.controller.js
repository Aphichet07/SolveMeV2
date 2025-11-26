import userStatsService from "../services/userStats.service.js"

const userStateController = {
    FindUser: async (req, res) => {
        try {
            const { lineID } = req.body

            if (!lineID){
                res.status(500).json({message: "IController Error"})
            }

            const state = await userStatsService.findUserDocByLineId(lineID)

            res.status(200).json(state)

        } catch (err) {
            console.log("Controller Error : ", err)
            res.status(500).json({message : "Internal Controller Error"})
        }
    },
}

export default userStateController