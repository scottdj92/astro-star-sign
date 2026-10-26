# astro-star-sign
An app to help me understand how astrology works

## Development

1. Create `.env.local` with a MongoDB connection string:
   ```
   MONGODB_URI="mongodb+srv://..."
   ```
   For a local database instead, run `npm run db:up` (Docker) and use `MONGODB_URI="mongodb://localhost:27017"`.
2. `npm install`
3. `npm run dev` and open http://localhost:3000
4. `npm test` runs the chart calculation tests

## API

- `POST /api/charts` with `{ "bornAt": "1990-06-15T08:00:00-04:00", "location": { "lat": 40.7128, "long": -74.006 } }` returns the chart, creating it the first time (201) and returning the stored one after that (200)
- `GET /api/charts/:id` returns a stored chart
