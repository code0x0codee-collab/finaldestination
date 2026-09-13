import {connectDB} from "./Database/index.js";
import dotenv from "dotenv";
import express from "express"
import {app as ap} from "./app.js"


dotenv.config({
    path:'./.env'
})

const app=express()
connectDB()
.then(()=>{
    app.listen(process.env.PORT|| 8001 , ()=>{
        console.log(`Server is running on Port: ${process.env.PORT}`)
    })
    
    app.on("error",(error)=>{
        console.log("ERROR: ",error)
        throw error
    })
})
.catch((err)=>{
    console.log(`Mysql error in index.js of src ${err}`)
})

app.use(ap)
