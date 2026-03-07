export const getBackendBaseUrl = (): string => {
  const raw = (import.meta.env.VITE_BACKEND_BASE_URL || "").trim();

  if (!raw) return "";

  // Allow absolute http(s), protocol-relative, or same-origin relative path.
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("/")) {
    return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
  }

  // Common misconfig: "localhost:8787" or "localhost"
  if (/^localhost$/i.test(raw)) {
    return "http://127.0.0.1:8787";
  }

  if (/^localhost:\d+$/i.test(raw) || /^[a-z0-9.-]+(?::\d+)?$/i.test(raw)) {
    return `http://${raw.replace(/\/+$/, "").replace(/\/api$/i, "")}`;
  }

  return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
};

export const backendApiUrl = (path: string): string => {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};
