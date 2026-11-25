import { useState, type ReactNode } from 'react';
import './MovieHighlight.css';

// Base URL of the small TMDB posters, as used by the movies list
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w185';

export interface MovieHighlightProps {
  /** Title of the movie. */
  title: string;
  /** TMDB path of the poster, e.g. "/abc.jpg", or `null` when there is none. */
  posterPath: string | null;
  /** Release year, or `null` when it is unknown. */
  releaseYear: number | null;
  /** Value highlighted for this movie, e.g. its rating. */
  children?: ReactNode;
}

/**
 * Movie displayed by a dashboard widget: its poster, title and release year,
 * followed by the value of the widget. A missing poster, or one that can not be
 * loaded, is replaced by an explicit placeholder.
 */
export default function MovieHighlight({
  title,
  posterPath,
  releaseYear,
  children,
}: MovieHighlightProps) {
  // Poster path whose image failed to load: a new path is tried again
  const [failedPosterPath, setFailedPosterPath] = useState<string | null>(null);
  const showPoster = posterPath !== null && posterPath !== failedPosterPath;

  return (
    <div className="movie-highlight">
      {showPoster ? (
        <img
          className="movie-highlight-poster"
          src={`${POSTER_BASE_URL}${posterPath}`}
          alt={`Affiche de ${title}`}
          onError={() => setFailedPosterPath(posterPath)}
        />
      ) : (
        <div
          className="movie-highlight-poster movie-highlight-poster-missing"
          role="img"
          aria-label={`Affiche indisponible pour ${title}`}
        >
          Affiche indisponible
        </div>
      )}
      <div className="movie-highlight-info">
        <p className="widget-card-highlight">{title}</p>
        <p className="movie-highlight-year">
          {releaseYear ?? 'Année inconnue'}
        </p>
        {children}
      </div>
    </div>
  );
}
