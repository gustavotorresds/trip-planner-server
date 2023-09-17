import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

// TODO: improve error handling
// TODO: check how mongoose can help with schema's and DB management
// TODO: convert to standard options from DB instead of creating on the fly

// Get all trips
router.get("/", async (req, res) => {
  try {
    let collection = await db.collection("trips");
    let results = await collection.find({})
      .toArray();

    res.send(results).status(200);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message});
  }
});

// Update by ID Method
router.patch('/:id', async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };

  const { startDate, destinations, } = req.body;

  let destinationsString = "";

  for (let destination of destinations) {
    destinationsString += `${destination.city} (${destination.numberOfDays} day(s)), `
  }
  destinationsString = destinationsString.substring(0, destinationsString.length - 2)

  // TODO: Results are a bit unstable, check what we can do to fix it
  // TODO: We might actually just want to cache a list of activities for each city, and let people play with it, instead of calling GPT for each update
  const gptPrompt = `[no prose] Create an itinerary of *activities* to do in: ${destinationsString}.
    Answer like this JSON example below, where each of the elements in the outer array is a day, and each of the elements in the inner array is one of the activities for each day: "
      [
        ["<activity 1 in day 1>", "<activity 2 in day 1>", ...],
        ["<activity 1 in day 2>", "<activity 2 in day 2>", ...],
        ["<activity 1 in day 3>", "<activity 2 in day 3>", ...],
        ...
      ]"`;

  try {
    // Check what GPT thinks
    const chatCompletion = await openai.chat.completions.create({
      messages: [{
        role: "user",
        content: `${gptPrompt}`
      }],
      model: "gpt-3.5-turbo",
      temperature: 0
    });

    // console.log('RAW: ', chatCompletion.choices[0].message.content);
    const itineraryResponse = JSON.parse(chatCompletion.choices[0].message.content);
    // console.log('RESP: ', itineraryResponse);
    const newItinerary = [ ...itineraryResponse ];

    // Build object to return to client
    // TODO: figure out a better way to do this. Also, need to not change things like flights/hotel
    for (let dayIndex = 0; dayIndex < itineraryResponse.length; dayIndex++) {
      for (let activityIndex = 0; activityIndex < itineraryResponse[dayIndex].length; activityIndex++) {
        const activityDescription = itineraryResponse[dayIndex][activityIndex];

        newItinerary[dayIndex][activityIndex] = {
          description: activityDescription,
          itineraryType: 0,
        };
      }
    }

    const updates = {
      $set: {
          startDate: new Date(req.body.startDate),
          cityFrom: req.body.cityFrom,
          destinations: req.body.destinations,
          itinerary: newItinerary,
        }
      };

    let collection = await db.collection("trips");
    let result = await collection.findOneAndUpdate(
      query,
      updates,
      { returnDocument: 'after'}
    );

    res.send(result).status(200);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message});
  }
});

export default router;
