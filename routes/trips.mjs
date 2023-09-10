import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get all trips
router.get("/", async (req, res) => {
  let collection = await db.collection("trips");
  let results = await collection.find({})
    .toArray();

  res.send(results).status(200);
});

export default router;

// const got = require('got');

// // Test GTP API
// router.post('/test', async (req, res) => {

//   const url = 'https://api.openai.com/v1/chat/completions';
//   const params = {
//     "model": "gpt-3.5-turbo",
//     "messages": [{"role": "user", "content": "Hello!"}],
//   };
//   const headers = {
//     "Content-Type": `application/json`,
//     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//   };

//   try {
//     const response = await got.post(url, { json: params, headers: headers }).json();
//     // output = `${response.choices[0].text}`;
//     console.log(response);
//     res.status(200).json(response);
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({ message: error.message});
//   }
// })
