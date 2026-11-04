# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: keep UI stateful at the page level with React components that fetch from `/api/*`, render loading/empty/success/error states, and expose accessible status/alert text so tests verify usability as well as data flow.
- Logic tier decision: handle validation and business logic in explicit service functions called by `/api` routes, with `400`-style errors for bad input and `404`/`409`-style cases when references are missing or invalid, rather than leaking raw cast errors or 500s.
- Data tier decision: define required Mongoose schema fields in the models and keep seed data idempotent and reconciliatory, using `findOneAndUpdate` plus membership cleanup so seeded demo users keep a stable team without deleting unrelated records.
- Activity tracking approach: require a valid user/team reference, normalized activity type, positive minutes, and computed points derived from the submitted duration; store the activity with a real timestamp for leaderboard and recommendation logic.
- Team management approach: require `name` and `mascot`, preserve `members` as an array with defaults, and only accept valid ObjectId values so team membership stays consistent with the user roster.
- Leaderboard approach: aggregate activity points by team, order by descending total points, and assign 1-based ranks from the sorted results to keep the ranking stable and testable.
- Workout suggestions approach: match recommendations to the user’s configured goal and most recent activity type, then attach a reason string explaining the connection to the user’s fitness pattern.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Verifies the schema rules and seed idempotency. Failures here usually mean the Mongoose validation or demo fixture setup is wrong before the API layer is even reached.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Validates the Express contract for activities, teams, leaderboard, and workout suggestions. Treat 501/empty responses here as a clear sign the service layer still has stubs or the route validation is missing.
- Frontend command: `npm test --prefix octofit-tracker/frontend -- --run`
  - Confirms the React pages render API data correctly, show loading/empty/error states, and expose accessible status text for screen readers.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Checks TypeScript correctness and catches route/service contract errors not exercised by the test suite.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Verifies the UI compiles with React and Vite, ensuring the page logic and API contracts remain compatible with the actual frontend build.
