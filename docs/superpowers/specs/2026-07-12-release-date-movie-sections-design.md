# Release-Date Movie Sections Design

## Goal

Keep HomePage movie sections accurate automatically as release dates pass.

## Classification

Classify normalized movies exclusively by the calendar portion of `releaseDate`, not by the persisted `category` field. Compare canonical `YYYY-MM-DD` values so browser timezone conversion cannot move a movie across the date boundary.

- A valid release date later than today appears in Coming Soon.
- A valid release date equal to or earlier than today appears in Now Showing.
- A missing or invalid release date appears in neither section.

Classification runs when HomePage fetches movies. A page load or refresh on a later day automatically moves released movies from Coming Soon to Now Showing without database updates.

## Structure

Add focused, pure date-classification helpers to `src/api/movieApi.js` so boundary behavior is independently testable. HomePage uses those helpers after existing response normalization. Preserve loading, request-error, empty-state, MovieCard, search, and unrelated UI behavior.

## Testing

Use a fixed reference date to test past, today, future, missing, malformed, and timezone-bearing release values. Update HomePage integration fixtures to prove stale category values cannot override release-date classification. Run the full frontend test suite and production build.
