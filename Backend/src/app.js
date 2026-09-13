import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))              
console.log(process.env.CORS_ORIGIN); 
app.use(express.json({limit:"16kb"}))                           
app.use(express.urlencoded({extended: true, limit:"16kb"}))    
app.use(cookieParser())

import adminRouter from "./Routes/adminRoutes.js"

import router from "./Routes/studentRoutes.js"
import teacherRouter from "./Routes/teacherRoutes.js"

app.use("/apistudent", router);
app.use("/apiteacher", teacherRouter);

app.use("/admin", adminRouter);

export {app}