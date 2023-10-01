# Trip planner server
Server for Trip Planner app

## Flight suggestions:
Provide origin + destinations cities, get back a list of flights that match the closest airports
* Uses SkyScanner to get the closest IATA codes (aiports)
* Then pings SkyScanner for the best flights
* Returns a list of options, in order of what we think is best