const express = require('express');
const app = express();
const port = 5000;
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./Database/dbconect");
connectDB();
const router = require("./Routes/routers");
app.use(express.json());
const updateAvailableBalance = require('./Accounts/updateBalance/updatebalance.js');


app.use("/",router)
updateAvailableBalance();

app.get("/", (req, res) =>{
    res.send("Backend Working");
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});