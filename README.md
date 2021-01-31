# Guild-Scrivener's Job

Currently

- Manages automation of editing & creating labels between repos using one repo as the source of truth.

- Raid stats coalescing, storage in FireStore & serving to frontend

### Environment Setup

create a `.env` file

```sh
AUTH= <GitHub Personal Access Token>
FIREBASE_URL=<https://stackoverflow.com/a/40168644/8367146>
OWNER=<Organization>
LABEL_REPO=<Main Repo For Label Control>
LABEL_HOOK_SECRET=<Webhook Secret>
RAID_HOOK_SECRET=<Webhook Secret>
PORT=<Any available port i.e. 8080>
```

- Create [GitHub Personal Access Token instructions](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)
- Create [GitHub Webhook instructions](https://docs.github.com/en/developers/webhooks-and-events/creating-webhooks)

## Commands

### `start`
