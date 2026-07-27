const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);

export function getYouTubeEmbedUrl(value) {
  if (!value || value === "#") {
    return null;
  }

  try {
    const url = new URL(value);
    let videoId = "";

    if (url.hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (YOUTUBE_HOSTS.has(url.hostname)) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else {
        const [kind, id] = url.pathname.split("/").filter(Boolean);
        if (kind === "embed" || kind === "shorts") {
          videoId = id || "";
        }
      }
    }

    return /^[A-Za-z0-9_-]{6,}$/.test(videoId)
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : null;
  } catch {
    return null;
  }
}
