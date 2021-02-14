export type DiscordSendWebhookPayload =
  | WebhookWithContent
  | WebhookWithEmbeds
  | WebhookWithFile
  | (WebhookWithContent & WebhookWithEmbeds & WebhookWithFile);

export type DiscordMessage = {
  // attachments: [];
  author: {
    avatar: string | null;
    bot: boolean;
    discriminator: string;
    id: string;
    username: string;
  };
  channel_id: string;
  content: string;
  edited_timestamp: string | null;
  // embeds: [];
  flags: number;
  id: string;
  // mention_everyone: boolean;
  // mention_roles: [];
  // mentions: [];
  // pinned: boolean;
  timestamp: string;
  tts: boolean;
  type: number;
  webhook_id: string;
};

// "Helper" types

interface WebhookBase {
  username?: string;
  avatar_url?: string;
  tts?: boolean;
}

interface WebhookWithContent extends WebhookBase {
  content: string;
}

interface WebhookWithEmbeds extends WebhookBase {
  embeds: Embed[];
}

interface WebhookWithFile extends WebhookBase {
  file: string;
}

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: Date;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedMultimedia;
  thumbnail?: EmbedMultimedia;
  video?: EmbedMultimedia;
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export interface EmbedAuthor {
  name?: string;
  url?: string;
  icon_url?: string;
}

export interface EmbedMultimedia {
  url?: string;
  height?: number;
  width?: number;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
}
