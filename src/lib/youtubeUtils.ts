/**
 * YouTube Utility Functions
 * Extracts YouTube Video IDs, generates high-quality thumbnails, and normalizes URLs.
 */

// Matches various YouTube URL formats:
// - https://www.youtube.com/watch?v=VIDEO_ID
// - https://m.youtube.com/watch?v=VIDEO_ID
// - https://youtu.be/VIDEO_ID
// - https://www.youtube.com/embed/VIDEO_ID
// - https://www.youtube.com/shorts/VIDEO_ID
// - https://www.youtube.com/v/VIDEO_ID
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;

/**
 * Extracts the 11-character YouTube video ID from a URL or raw ID string.
 */
export function extractYouTubeVideoId(urlOrId?: string | null): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();

  // If already an 11-character alphanumeric/dash/underscore ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

/**
 * Validates if the string contains a valid YouTube video ID or link
 */
export function isValidYouTubeUrl(urlOrId?: string | null): boolean {
  return extractYouTubeVideoId(urlOrId) !== null;
}

/**
 * Generates a direct thumbnail URL for a YouTube video.
 * Uses mqdefault (320x180) or hqdefault (480x360) which are universally available for all YouTube videos.
 */
export function getYouTubeThumbnailUrl(
  urlOrId?: string | null,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'maxresdefault' = 'hqdefault'
): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Returns the canonical watch URL for a video (e.g. https://www.youtube.com/watch?v=VIDEO_ID)
 */
export function getYouTubeWatchUrl(urlOrId?: string | null): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Returns the embed URL for iframe players (e.g. https://www.youtube-nocookie.com/embed/VIDEO_ID)
 */
export function getYouTubeEmbedUrl(urlOrId?: string | null): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}
