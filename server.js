const express = require('express');
const app = express();
const port = 5000;
const dotenv = require("dotenv");
const cors = require('cors');
dotenv.config();
const connectDB = require("./Database/dbconect");
connectDB();
const router = require("./Routes/routers");
// Increase request payload limit in Express

const bodyParser = require('body-parser');


// Increase limit to 10MB (adjust as needed)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Your other routes and server setup here


// Enable CORS for all origins
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow all methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));

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