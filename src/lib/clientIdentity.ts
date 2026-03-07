const DEVICE_UUID_KEY = "tn_device_uuid";

const hashString = (input: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const getOrCreateDeviceUuid = (): string => {
  const existing = localStorage.getItem(DEVICE_UUID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(DEVICE_UUID_KEY, generated);
  return generated;
};

export const getClientIdentityHeaders = () => {
  const rawFingerprint = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  const browserFingerprint = hashString(rawFingerprint);
  const deviceUuid = getOrCreateDeviceUuid();

  return {
    "x-browser-fingerprint": browserFingerprint,
    "x-device-uuid": deviceUuid,
  };
};
