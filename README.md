# Guild-Scrivener's Job

Currently

- Manages automation of editing & creating labels between repos using one repo as the source of truth.

- Raid stats coalescing, storage in FireStore & serving to frontend

### Environment Setup

create a `.env` file and add in the [GitHub Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

```sh
AUTH=
FIREBASE_URL=
OWNER=
LABEL_REPO=
LABEL_HOOK_SECRET=
RAID_HOOK_SECRET=
PORT=
```

## Commands

### `start`
