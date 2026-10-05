import type { MovieDetails } from '../../back-end/schemas/MoviesTypes';
import './MovieDetailCard.css';

type MovieDetailCardProps = {
  movie: MovieDetails;
};

export default function MovieDetailCard({ movie }: MovieDetailCardProps) {
  const releaseYear = movie.release_date.slice(0, 4);
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <article className="movie-detail-card">
      <figure className="movie-detail-hero-container">
        {posterUrl ? (
          <img
            className="movie-detail-hero"
            src={posterUrl}
            alt={`Affiche de ${movie.title}`}
          />
        ) : (
          <div className="movie-detail-hero movie-detail-hero-placeholder" />
        )}
      </figure>

      <div className="movie-detail-copy">
        <p className="movie-detail-kicker">Détails du film</p>
        <h1>{movie.title}</h1>
        {movie.tagline ? (
          <p className="movie-detail-tagline">{movie.tagline}</p>
        ) : null}

        <dl className="movie-detail-meta">
          {releaseYear ? (
            <div>
              <dt>Année de sortie</dt>
              <dd>{releaseYear}</dd>
            </div>
          ) : null}
          <div>
            <dt>Note</dt>
            <dd>{movie.vote_average.toFixed(1)}</dd>
          </div>
        </dl>

        {movie.genres.length > 0 ? (
          <section className="movie-detail-section">
            <h2>Genres</h2>
            <ul className="movie-detail-genres">
              {movie.genres.map((genre) => (
                <li key={genre.id}>{genre.name}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="movie-detail-section">
          <h2>Résumé</h2>
          <p>{movie.overview || 'Aucun résumé disponible.'}</p>
        </section>
      </div>
    </article>
  );
}
