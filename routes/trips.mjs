import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get a list of 50 posts
router.get("/", async (req, res) => {
  let collection = await db.collection("trips");
  let results = await collection.find({})
    .toArray();

  res.send(results).status(200);
});

export default router;

// const express = require('express');
// const Model = require('../models/model');
// const router = express.Router();

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

// //Post Method
// router.post('/post', async (req, res) => {
//   const data = new Model({
//     name: req.body.name,
//     age: req.body.age
//   })

//   try {
//     const dataToSave = await data.save();
//     res.status(200).json(dataToSave)
//   }
//   catch (error) {
//     res.status(400).json({ message: error.message })
//   }
// })

// //Get all Method
// router.get('/getAll', async (req, res) => {
//   try {
//     const data = await Model.find();
//     res.json(data);
//   } catch (error) {
//     res.status(500).json({message: error.message})
//   }
// })

// //Get by ID Method
// router.get('/getOne/:id', async (req, res) => {
//   try {
//     const data = await Model.findById(req.params.id);
//     res.json(data);
//   } catch(error) {
//     res.status(500).json({message: error.message})
//   }
// })

// //Update by ID Method
// router.patch('/update/:id', async (req, res) => {
//   try {
//     const id = req.params.id;
//     const updatedData = req.body;
//     const options = {new: true};

//     const result = await Model.findByIdAndUpdate(
//       id, updatedData, options
//     );

//     res.send(result);
//   } catch (error) {
//     res.status(400).json({ message: error.message})
//   }
// })

// //Delete by ID Method
// router.delete('/delete/:id', async (req, res) => {
//   try {
//     const id = req.params.id;
//     const data = await Model.findByIdAndDelete(id);
//     res.send(`Document with ${data.name} has been deleted..`)
//   } catch (error) {
//     res.status(400).json({ message: error.message })
//   }
// })

// module.exports = router;