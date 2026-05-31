# Recruiter Defense Sheet: Platform Account Support

## Architectural choices

- Added `ContestAccount` as a separate Prisma model instead of putting platform handles directly on `User`. This keeps user identity/auth separate from competitive programming identities and lets the product add more platforms later.
- Used a `Platform` enum with `CODEFORCES` and `LEETCODE` so unsupported platform values cannot enter the database.
- Added `User -> ContestAccount` as a one-to-many relationship with `onDelete: Cascade`, so deleting a user also deletes their linked platform accounts.
- Kept route ownership checks in the service layer. Every list/delete operation scopes by `userId`, and delete uses `deleteMany({ id, userId })` so users cannot delete accounts they do not own.
- Kept validation separate from controllers. Controllers handle HTTP shape, services handle business rules, validators handle request correctness.
- Reused the JWT authentication middleware for `/api/platforms`, preserving the authentication flow instead of introducing a second auth mechanism.

## Tradeoffs

- The schema enforces one account per platform per user with `@@unique([userId, platform])`. This is simple for MVP behavior, but if the product later supports multiple handles per platform, that constraint should become `@@unique([userId, platform, handle])` or be removed.
- The same platform handle is not globally unique across all users. This avoids blocking legitimate users before ownership verification exists, but production should add external verification before making platform handles authoritative.
- Platform handle validation is intentionally generic. Codeforces and LeetCode have different username rules, so platform-specific validators can be added later when needed.
- Delete returns `404` for accounts not owned by the user. This avoids revealing whether another user's account ID exists.

## Scalability discussion

- `ContestAccount.userId` is indexed, which keeps listing a user's accounts efficient.
- The unique `(userId, platform)` index prevents duplicate rows even under concurrent requests.
- The module boundary makes future platform sync jobs straightforward: a worker can query `ContestAccount` records by platform and enqueue fetches without touching auth code.
- If platform account count grows heavily, pagination can be added to `GET /api/platforms`; the current endpoint is fine for MVP because each user has a tiny bounded set of accounts.
- For external contest syncing, add fields like `lastSyncedAt`, `syncStatus`, and `externalProfileVerifiedAt` rather than overloading the account table with contest data.

## Production concerns

- Add platform ownership verification before trusting a handle for rankings or private user claims.
- Add rate limiting to authenticated mutation routes to reduce abuse.
- Add audit logs for account add/delete events if platform identity becomes important.
- Keep JWT secrets strong and rotateable through environment variables.
- Add request logging and correlation IDs for debugging production incidents.
- Add integration tests against a real PostgreSQL test database in CI, alongside the current isolated route tests.
- Consider soft deletes if account history matters; hard delete is simpler for MVP.

## Interview questions to expect

- Why did you create a separate `ContestAccount` table instead of adding `codeforcesHandle` and `leetcodeHandle` columns to `User`?
- How do you prevent one user from deleting another user's platform account?
- Why did you choose `404` instead of `403` when deleting someone else's account?
- What does the unique `(userId, platform)` constraint protect against?
- How would you support more platforms later?
- How would you verify that a user really owns a Codeforces or LeetCode handle?
- What changes would you make if users could have multiple handles on the same platform?
- How would you design background syncing for contests and user submissions?
- What tests would you add before shipping this to production?
- How would you monitor and debug failures in platform sync jobs?
