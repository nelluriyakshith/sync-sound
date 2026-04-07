export interface AppSettings {
  nickname: string;
  autoConnect: boolean;
  highQuality: boolean;
  darkMode: boolean;
  notifications: boolean;
}

const SETTINGS_STORAGE_KEY = "syncsound:settings";

export const getDefaultDeviceName = () => {
  if (typeof navigator === "undefined") return "My Device";

  const ua = navigator.userAgent;

  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";

  if (/Android/.test(ua)) {
    const buildMatch = ua.match(/;\s*([^;)]+)\s*Build/);
    if (buildMatch) return buildMatch[1].trim();

    const androidMatch = ua.match(/Android[^;]*;\s*([^;)]+)/);
    if (androidMatch) return androidMatch[1].trim();

    return "Android Device";
  }

  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/CrOS/.test(ua)) return "Chromebook";
  if (/Linux/.test(ua)) return "Linux PC";
  if (/Chrome/.test(ua)) return "Chrome Browser";
  if (/Firefox/.test(ua)) return "Firefox Browser";
  if (/Safari/.test(ua)) return "Safari Browser";

  return "My Device";
};

const normalizeNickname = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : getDefaultDeviceName();
};

export const getDefaultAppSettings = (): AppSettings => ({
  nickname: getDefaultDeviceName(),
  autoConnect: true,
  highQuality: false,
  darkMode: true,
  notifications: true,
});

export const loadAppSettings = (): AppSettings => {
  const defaults = getDefaultAppSettings();

  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Partial<AppSettings> | null;

    return {
      ...defaults,
      ...parsed,
      nickname: normalizeNickname(parsed?.nickname),
    };
  } catch {
    return defaults;
  }
};

export const saveAppSettings = (settings: AppSettings) => {
  if (typeof window === "undefined") return;

  const normalizedSettings: AppSettings = {
    ...settings,
    nickname: normalizeNickname(settings.nickname),
  };

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
};

export const getSavedDeviceName = () => loadAppSettings().nickname;