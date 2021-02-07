# Guild-Scrivener's Job

Currently

- Manages automation of editing & creating labels between repos using one repo as the source of truth.

- Raid stats coalescing, storage in FireStore & serving to frontend

### Environment Setup

create a `.env` file

- `FIREBASE_URL` The project's [Firebase URL](https://stackoverflow.com/a/40168644/8367146) from the console
- `FIREBASE_SERVICE_ACCOUNT_KEY` The service account key JSON
- `RAID_HOOK_SECRET` The Raid (Stats) Hooks' secret - see [GitHub Webhook Secret](https://docs.github.com/en/developers/webhooks-and-events/creating-webhooks)
- `LABEL_HOOK_SECRET` The Label Hooks' secret - see [GitHub Webhook Secret](https://docs.github.com/en/developers/webhooks-and-events/creating-webhooks)
- `AUTH` A [GitHub Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)
- `OWNER` Should be `OpenSourceRaidGuild`
- `LABEL_REPO` Should be `website`
- `PORT` **_optional_** Only useful for production - not setting this uses port 5000

## Commands

## `firestore`

Starts the firestore emulator, and runs the provided script. The emulator is closed once the script has completed.

### `start`

Runs the server - needs to have been built first `npm run build`

### `local`

Runs dev server on `PORT` (or 5000 if not set) after starting the firestore emulator

### `build`

Builds the server using `tsc`

### `test`

Runs Jest in watch mode after starting the firestore emulator

### `test:coverage`

Runs Jest while checking coverage
