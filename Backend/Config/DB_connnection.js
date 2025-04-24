const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = async()=>{
    await mongoose.connect(process.env.DB,{
    }).then(()=>{
        console.log("DB connect successfully");
    }).catch((err)=>{
        console.log("Error occur in DB");
    });
}