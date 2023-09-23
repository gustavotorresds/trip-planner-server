// Basic setup based on https://www.mongodb.com/languages/express-mongodb-rest-api-tutorial and https://www.mongodb.com/languages/mern-stack-tutorial

import express from "express";
import cors from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import trips from "./routes/trips.mjs";
import destinations from "./routes/destinations.mjs";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

// Load routes
app.use("/api/trips", trips);
app.use("/api/destinations", destinations);

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.")
})

// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
