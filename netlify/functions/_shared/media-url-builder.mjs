const MEDIA_URL_BASE = "https://leider-geil.local";

export function buildMediaUrl(pathname, searchParams = {}) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function parseMediaUrl(value) {
  const mediaUrl = String(value || "").trim();
  if (!mediaUrl) return null;

  try {
    return new URL(mediaUrl, MEDIA_URL_BASE);
  } catch {
    return null;
  }
}
