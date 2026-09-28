import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router';
import type { Movie } from '../back-end/schemas/MoviesTypes';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../back-end/constants';
import MovieItem from './components/MovieItem';
import './app.css';

type MoviesApiResponse = {
  results: Movie[];
};

function MoviesPage() {
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // read parameters from the URL query string
  const queryParams = new URLSearchParams(window.location.search);
  const language = queryParams.get('language') || DEFAULT_LANGUAGE;
  const page = queryParams.get('page') || DEFAULT_PAGE;
  const region = queryParams.get('region') || DEFAULT_REGION;

  // useEffect hook to fetch data from an API when the component mounts
  useEffect(() => {
    // fetch data from an API /api/movies/popular
    fetch(
      `/api/movies/popular?language=${language}&page=${page}&region=${region}`,
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Impossible de récupérer les films populaires.');
        }

        return response.json() as Promise<MoviesApiResponse>;
      })
      .then((data) => setMovies(data.results))
      .catch(() => setError('Impossible de charger les films populaires.'));
  }, [language, page, region]);

  return (
    <>
      <header className="app-header">
        <h1>Films populaires</h1>
        <h2>
          Films tendances en France, d'après les données de{' '}
          <b>The Movie Database</b>
        </h2>
      </header>
      <section>
        {error ? <p>{error}</p> : null}
        {movies ? (
          <ul className="movie-grid">
            {movies.map((movie) => (
              <li key={movie.id}>
                <article>
                  <MovieItem movie={movie} />
                </article>
              </li>
            ))}
          </ul>
        ) : error ? null : (
          <p className="status-message">Loading...</p>
        )}
      </section>
    </>
  );
}

function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [error, setError] = useState<string | null>(null);

  // fetch the movie details from the back-end /api/movies/:id
  useEffect(() => {
    if (!id) return;

    fetch(`/api/movies/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Film introuvable.');
        }
        return response.json() as Promise<Movie>;
      })
      .then(setMovie)
      .catch(() => setError('Impossible de charger les détails du film.'));
  }, [id]);

  if (!id || error) {
    return <p className="status-message">{error ?? 'Film introuvable.'}</p>;
  }

  if (!movie) {
    return <p className="status-message">Chargement du film...</p>;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <article className="movie-detail">
      {posterUrl ? (
        <img
          className="movie-detail__poster"
          src={posterUrl}
          alt={`Affiche de ${movie.title}`}
        />
      ) : null}
      <div className="movie-detail__content">
        <h1>{movie.title}</h1>
        <p className="movie-detail__meta">
          {movie.release_date.slice(0, 4)} · ★ {movie.vote_average.toFixed(1)}
        </p>
        <p>{movie.overview || 'Aucun synopsis disponible.'}</p>
        <Link className="back-link" to="/movies">
          ← Retour aux films populaires
        </Link>
      </div>
    </article>
  );
}

function NotFoundPage() {
  return (
    <section className="empty-state">
      <h1>Cette page n'existe pas</h1>
      <Link className="back-link" to="/movies">
        ← Retour aux films populaires
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/movies" replace />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
