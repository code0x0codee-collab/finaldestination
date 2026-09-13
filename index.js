import express from "express"
const app=express();
import path from "path"
//configure dotenv
import dotenv from "dotenv"
dotenv.config()
//ejs files setup
app.set("view engine","ejs");
app.set("views",path.resolve("./views"));
app.get("/",(req,res)=>{
    res.render("homepage")
})

app.listen(process.env.PORT)