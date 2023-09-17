import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

const generateItinerary = async (destinations) => {
  let destinationsCollection = await db.collection("destinations");

  // Build empty itinerary
  const newItinerary = [];

  // Update the trip itinerary: for each destination, dep on the number of days you are there, find a reasonable number of activities to do, spread it across the days
  for (let destinationIdx = 0; destinationIdx < destinations.length; destinationIdx++) {
    // For each of the destinations, find the activities to do
    const destination = destinations[destinationIdx];
    const dbDestination = await destinationsCollection.findOne({ name: destination.city })

    // Fill out each day with the list of potential activities that haven't been used yet
    let activitiesStartingIdx = 0;
    for (let dayIdx = 0; dayIdx < destination.numberOfDays; dayIdx++) {
      const activitiesPerDay = 2; // TODO: figure out a better way to define how many activities a day

      // For the list of activities in the destination (which is just a string), we get the activities that were not used yet, then conver them to the format that trip itinerary takes
      const dayItinerary = 
        dbDestination
          .activities
          .slice(activitiesStartingIdx, activitiesStartingIdx + activitiesPerDay)
          .map((activityDescription) => {
            return {
                description: activityDescription,
                itineraryType: 0 // TODO: refactor this to use constants
            }
          });

      newItinerary.push(dayItinerary);
      activitiesStartingIdx += activitiesPerDay; // Update where we should pick next set of activities from
    }
  }

  return newItinerary
}

// TODO: improve error handling
// TODO: check how mongoose can help with schema's and DB management

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

  const { cityFrom, startDate, destinations, } = req.body;

  try {
    const updates = {
      $set: {
          startDate: new Date(startDate),
          cityFrom: cityFrom,
          destinations: destinations,
          itinerary: await generateItinerary(destinations),
        }
      };

    let tripsCollection = await db.collection("trips");
    let result = await tripsCollection.findOneAndUpdate(
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
