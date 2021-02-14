export interface UserStats {
  userId: number;
  user: string;
  avatarUrl: string;
  additions: number;
  deletions: number;
  commits: number;
}

export interface RaidStats {
  dungeon: string;
  title: string;
  status: 'active' | 'completed';
  createdAt: number;
  duration?: number;
  additions: number;
  deletions: number;
  commits: number;
  changedFiles: number;
  files: {
    [key: string]: {
      url: string;
      filename: string;
      contributors: number[];
    };
  };
  contributors: {
    [key: number]: UserStats;
  };
  discordMessageId: string;
}
