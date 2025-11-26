//  main server
import express from "express";
import dotenv from "dotenv";
import router from "./routes/routes.js";
import cors from "cors";


dotenv.config(); 
const app = express();
app.use(cors());
app.use(express.json())
app.use(router)


app.get("/", (req,res) =>{
    console.log("Hello")
    res.status(200).json({message: "Success"})
})

app.listen(process.env.SERVER_PORT, ()=>{
    console.log(`Server is running on port :  http://127.0.0.1:${process.env.SERVER_PORT}`)
});