import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get all destinations
router.get("/", async (req, res) => {
  try {
    let collection = await db.collection("destinations");
    let results = await collection
      .find({})
      .project({ name: 1, })
      .toArray();

    res.send(results).status(200);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message});
  }
});

export default router;
