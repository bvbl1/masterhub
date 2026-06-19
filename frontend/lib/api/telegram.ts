import { post } from "./client";

export type TelegramTokenResponse = {
  token: string;
  telegram_url?: string;
  expires_at?: string;
};

function buildTelegramUrl(token: string): string {
  const botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.trim();
  if (botUrl) {
    const url = new URL(botUrl);
    url.searchParams.set("start", token);
    return url.toString();
  }

  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  if (!username) {
    throw new Error(
      "Set NEXT_PUBLIC_TELEGRAM_BOT_URL or NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
    );
  }

  const name = username.replace(/^@/, "");
  return `https://t.me/${name}?start=${encodeURIComponent(token)}`;
}

export async function generateTelegramLink(): Promise<
  TelegramTokenResponse & { telegram_url: string }
> {
  const data = await post<TelegramTokenResponse>("/users/telegram-token", undefined, {
    auth: true,
  });

  const telegram_url =
    data.telegram_url?.trim() || buildTelegramUrl(data.token);

  return { ...data, telegram_url };
}

export async function openTelegramLink(): Promise<string> {
  const { telegram_url } = await generateTelegramLink();
  window.open(telegram_url, "_blank", "noopener,noreferrer");
  return telegram_url;
}
