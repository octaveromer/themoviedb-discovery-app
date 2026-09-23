import type { Movie } from '../../back-end/schemas/MoviesTypes';
import { Link } from 'react-router';

type MovieItemProps = {
  movie: Movie;
};

export default function MovieItem({ movie }: MovieItemProps) {
  const releaseYear = movie.release_date.slice(0, 4);
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
    : null;
  const rating = movie.vote_average.toFixed(1);

  return (
    <Link className="movie-card" to={`/movies/${movie.id}`}>
      <div className="movie-poster-wrap">
        {posterUrl ? (
          <img
            className="movie-poster"
            src={posterUrl}
            alt={`Affiche de ${movie.title}`}
          />
        ) : (
          <div className="movie-poster" />
        )}
        <span className="rating-badge">
          <span className="rating-badge__star" aria-hidden="true">
            ★
          </span>
          {rating}
        </span>
      </div>
      <div className="movie-card__content">
        <h2>{movie.title}</h2>
        <p>{releaseYear}</p>
      </div>
    </Link>
  );
}
