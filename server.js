require("dotenv").config({quiet:true});
const express = require("express");
const path = require("path");


const server = express();
const PORT = process.env.PORT || 3000;

server.use(express.json());
server.use(express.static(path.join(__dirname, "public")));

server.set(express.static(path.join(__dirname,"views")));

server.set("view engine", "ejs");

server.get("/",(req,res)=>{
    res.render("layouts/boilerplate.ejs");
});

server.listen(PORT,()=>{
    console.log("Server is working!");
});
