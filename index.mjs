// Basic setup based on https://www.mongodb.com/languages/express-mongodb-rest-api-tutorial and https://www.mongodb.com/languages/mern-stack-tutorial

import express from "express";
import cors from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import trips from "./routes/trips.mjs";


const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

// Load the /posts routes
app.use("/api/trips", trips);

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.")
})

// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

// const cors = require('cors');
// const express = require('express');
// const mongoose = require('mongoose');
// const mongoString = process.env.DATABASE_URL;

// dotenv.config();

// mongoose.connect(mongoString);
// const database = mongoose.connection;

// database.on('error', (error) => {
//   console.log(error)
// })

// database.once('connected', () => {
//   console.log('Database Connected');
// })

// const app = express();  //Create new instance
// app.use(cors())
// app.use(express.json());

// const routes = require('./routes/routes');
// app.use('/api', routes);

// app.listen(3000, () => {
//     console.log(`Server Started at ${3000}`)
// })
