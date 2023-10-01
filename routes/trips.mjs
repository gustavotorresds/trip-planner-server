import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import axios from "axios";
import dayjs from 'dayjs';

const router = express.Router();

const skyScannerKey = process.env.SKYSCANNER_KEY || "";
const SKYSCANNER_BASE_URL = 'https://partners.api.skyscanner.net/apiservices/v3/';
const SKYSCANNER_ROUTE_AUTOSUGGEST = 'autosuggest/flights';
const SKYSCANNER_ROUTE_FLIGHTSEARCH = 'flights/live/search/create';
const SKYSCANNER_ROUTE_FLIGHTPOLL = 'flights/live/search/poll';

const skyScannerAxios = axios.create({
  baseURL: SKYSCANNER_BASE_URL,
  timeout: 10000,
  headers: {
    'x-api-key': skyScannerKey,
    'Content-Type': 'application/json',
  },
});

const getIataCode = async (city) => {
  // IMPORTANT TODO: create own dictionary of city -> IATA code that we can retrieve from. When not found, can ping SkyScanner, and save result.
  // Create a friendly way to interact with origin + all destinations and dates (depends on APIs)
  // TODO: prob want to use entityID instead
  const response = await skyScannerAxios.post(SKYSCANNER_ROUTE_AUTOSUGGEST, {
    query: {
      market: 'US',
      locale: 'en-US',
      searchTerm: city,
      includedEntityTypes: ['PLACE_TYPE_CITY', 'PLACE_TYPE_AIRPORT'],
      limit: 5,
      isDestination: true, // TODO: should it be false?
    },
  });

  return response.data.places[0].iataCode;
}

const getPlaceFromId = async (entityId) => {
  let placesCollection = db.collection("flight_places");

  const query = { [`places.${entityId}`]: { $exists: true } };
  const projection = { projection: { [`places.${entityId}`]: 1, _id: 0 } };

  // Find the document with specified ID
  const result = await placesCollection.findOne(query, projection);

  console.log('PLACE NAME: ', result);

  if(!!result) {
    return result.places[`${entityId}`];
  }

  return undefined;
}

const getFlightItinerary = async (startDateJS, cityFrom, destinations) => {
  // Find the IATA code relative to origin + all destinations
  const { cityFromIataCode, destinationsIataCodes } =  {
    cityFromIataCode: 'SAO',
    destinationsIataCodes: ['PAR', 'LON'],
  };
  // const cityFromIataCode = await getIataCode(cityFrom);

  // const destinationsIataCodes = [];
  // for (let i = 0; i < destinations.length; i++) {
  //   const destinationIataCode = await getIataCode(destinations[i].city)
  //   destinationsIataCodes.push(destinationIataCode);
  // }

  const queryLegs = [];

  let latestDateJS = startDateJS;

  for (let i = 0; i < destinations.length + 1; i++) {
    const isFirst = (i <= 0);
    const isLast = (i >= destinations.length);

    const queryLeg = {
      originPlaceId: {
        iata: (isFirst ? cityFromIataCode : destinationsIataCodes[i - 1]),
      },
      destinationPlaceId: {
        iata: (isLast ? cityFromIataCode : destinationsIataCodes[i]),
      },
      date: {
        year: latestDateJS.year(),
        month: latestDateJS.month() + 1, // 0-indexed
        day: latestDateJS.date(),
      }
    }

    queryLegs.push(queryLeg);
    if (!isLast) {
      latestDateJS = latestDateJS.add(destinations[i].numberOfDays, 'day');
    }
  }

  console.log('LEGS: ', queryLegs);

  const itineraryResposne = await skyScannerAxios.post(SKYSCANNER_ROUTE_FLIGHTSEARCH, {
    query: {
      market: 'US',
      locale: 'en-US',
      currency: 'USD',
      query_legs: queryLegs,
      adults: 1,
      childrenAges: [],
      cabinClass: 'CABIN_CLASS_ECONOMY',
      excludedAgentsIds: [],
      excludedCarriersIds: [],
      includedAgentsIds: [],
      includedCarriersIds: [],
      nearbyAirports: false,
    }
  });

  const sessionToken = itineraryResposne.data.sessionToken;

  const itineraryPollResponse = await skyScannerAxios.post(`${SKYSCANNER_ROUTE_FLIGHTPOLL}/${sessionToken}`, {
    query: {
      market: 'US',
      locale: 'en-US',
      currency: 'USD',
      query_legs: queryLegs,
      adults: 1,
      childrenAges: [],
      cabinClass: 'CABIN_CLASS_ECONOMY',
      excludedAgentsIds: [],
      excludedCarriersIds: [],
      includedAgentsIds: [],
      includedCarriersIds: [],
      nearbyAirports: false,
    }
  });

  // console.log('TOKEN: ', sessionToken);
  // console.log('ITINERARIES: ', itineraryPollResponse.data.content.results.itineraries);

  const suggestedItineraryId = itineraryPollResponse.data.content.sortingOptions.best[0].itineraryId;
  const suggestedItinerary = itineraryPollResponse.data.content.results.itineraries[suggestedItineraryId];
  const suggestedLegs = [];
  for (let i = 0; i < suggestedItinerary.legIds.length; i++) {
    const legId = suggestedItinerary.legIds[i];
    const legObj = itineraryPollResponse.data.content.results.legs[legId];

    const originInfo = await getPlaceFromId(legObj.originPlaceId);
    const destinationInfo = await getPlaceFromId(legObj.destinationPlaceId);

    legObj.originName = originInfo.name;
    legObj.originIata = originInfo.iata;

    legObj.destinationName = destinationInfo.name;
    legObj.destinationIata = destinationInfo.iata;

    suggestedLegs.push(legObj);

    // const carriers = legObj.operatingCarrierIds;
    // for (let j = j < carriers.length; j++) {
    //   const carrier =
    // }
  }

  suggestedItinerary.legs = suggestedLegs;

  return suggestedItinerary;
}

const generateItinerary = async (startDateJS, cityFrom, destinations) => {
  // Request the itinerary for all those IATA codes and dates
  // TODO: remove comment

  const suggestedItinerary =  await getFlightItinerary(startDateJS, cityFrom, destinations);
  console.log('ITINERARY: ', suggestedItinerary)


  // Maybe: convert response to a more friendly format
  // [...]

  // Find activity options
  let destinationsCollection = await db.collection("destinations");

  // Build empty itinerary
  const newItinerary = [];

  // Update the trip itinerary: for each destination, dep on the number of days you are there, find a reasonable number of activities to do, spread it across the days
  for (let destinationIdx = 0; destinationIdx < destinations.length; destinationIdx++) {
    // TODO: Add flight to destination

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

  const startDateJS = dayjs(startDate);

  try {
    const updates = {
      $set: {
          startDate: new Date(startDate),
          cityFrom: cityFrom,
          destinations: destinations,
          itinerary: await generateItinerary(startDateJS, cityFrom, destinations),
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
