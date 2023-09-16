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
