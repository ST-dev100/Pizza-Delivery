const express = require("express")

const app = express()

app.get('/',(req,res)=>{
    res.json({a:"bbb"})
})
app.listen(3000,()=>{
    console.log("hello")
})

// Export the serverless function
module.exports = app;