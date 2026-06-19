export {
  ApiError,
  REMEMBER_LOGIN_EMAIL_KEY,
  getRememberedLoginEmail,
  clearToken,
  getToken,
  setRememberedLoginEmail,
  setToken,
} from "./client";

export * as authApi from "./auth";
export { pickAvatarUrlFromRaw } from "./auth";
export * as chatApi from "./chat";
export * as categoriesApi from "./categories";
export * as analyticsApi from "./analytics";
export type { OrderAnalytics, OrderStatusCount } from "./analytics";
export * as servicesApi from "./services";
export * as locationsApi from "./locations";
export * as ordersApi from "./orders";
export * as paymentsApi from "./payments";
export * as reviewsApi from "./reviews";
export * as mediaApi from "./media";
export * as jobRequestsApi from "./jobRequests";
export * as providerApplicationApi from "./providerApplication";
export * as favoritesApi from "./favorites";

export type { FavoriteProviderSummary } from "./favorites";

export * as aiChatApi from "./aiChat";
export * as telegramApi from "./telegram";
export { generateTelegramLink, openTelegramLink } from "./telegram";
export type { TelegramTokenResponse } from "./telegram";

export type * from "./types";
