import { getYouTubeEmbedUrl } from "./trailerUrl";

describe("getYouTubeEmbedUrl", () => {
  test.each([
    [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    ],
    [
      "https://youtu.be/dQw4w9WgXcQ?t=12",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    ],
    [
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    ],
    [
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    ],
  ])("converts %s into an autoplay embed URL", (input, expected) => {
    expect(getYouTubeEmbedUrl(input)).toBe(expected);
  });

  test.each([
    "",
    "#",
    "not a url",
    "https://vimeo.com/1234",
    "https://youtube.com/watch",
  ])("rejects unsupported trailer value %s", (input) => {
    expect(getYouTubeEmbedUrl(input)).toBeNull();
  });
});
