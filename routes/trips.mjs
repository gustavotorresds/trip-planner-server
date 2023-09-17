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

  let destinationsCollection = await db.collection("destinations");

  try {
    // Build empty itinerary
    let numberOfDays = 0;
    for (let destination of destinations) {
      numberOfDays += destination.numberOfDays;
    }
    const newItinerary = Array(numberOfDays).fill([]); // TODO: check if helpful to fill, might be better not to

    // Update the trip itinerary: for each destination, dep on the number of days you are there, find a reasonable number of activities to do, spread it across the days
    let overallDayIndex = 0;
    for (let destinationIndex = 0; destinationIndex < destinations.length; destinationIndex++) {
      // For each of the destinations, find the activities to do
      const destination = destinations[destinationIndex];  
      const destinationResult = await destinationsCollection.findOne({ name: destination.city })
      const allDestinationActivities = destinationResult.activities;

      // Fill out each day with the list of potential activities
      let startingIndex = 0;
      for (let dayIndex = 0; dayIndex < destination.numberOfDays; dayIndex++) {
        const numActivities = 2; // TODO: figure out a better way to define how many activities a day
        const activitiesDescription = allDestinationActivities.slice(startingIndex, startingIndex + numActivities);
        newItinerary[overallDayIndex] = activitiesDescription.map((activityDescription) => {
          return { description: activityDescription, itineraryType: 0}
        });
        startingIndex += numActivities;
        overallDayIndex++;
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
