import got from 'got';
import { DiscordSendWebhookPayload, DiscordMessage } from './types';

export async function sendWebhookMessage(
  webhookUrl: string,
  payload: DiscordSendWebhookPayload
): Promise<DiscordMessage> {
  const fullUrl = `${webhookUrl}?wait=true`;

  return await got
    .post(fullUrl, {
      json: payload,
    })
    .json<DiscordMessage>();
}

export async function deleteWebhookMessage(
  webhookUrl: string,
  messageId: string
) {
  const fullUrl = `${webhookUrl}/messages/${messageId}`;

  return await got.delete(fullUrl);
}
