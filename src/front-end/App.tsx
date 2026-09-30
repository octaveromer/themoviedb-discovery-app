import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router';
import type { Movie, MovieDetails } from '../back-end/schemas/MoviesTypes';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../back-end/constants';
import MovieDetailCard from './components/MovieDetailCard';
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

  useEffect(() => {
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
      <section className="catalog-heading">
        <div>
          <h1>Films populaires</h1>
          <h2>
            Films tendances en France, d'après les données de{' '}
            <b>The Movie Database</b>
          </h2>
        </div>
      </section>
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
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // fetch the movie details from the back-end /api/movies/:id
  useEffect(() => {
    if (!id) return;

    fetch(`/api/movies/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Film introuvable.');
        }
        return response.json() as Promise<MovieDetails>;
      })
      .then(setMovie)
      .catch(() => setError('Impossible de charger les détails du film.'));
  }, [id]);

  return (
    <section className="movie-detail-page">
      <header className="movie-detail-page__header">
        <h1>Détails du film</h1>
        <Link className="back-link" to="/movies">
          ← Retour vers les films populaires
        </Link>
      </header>
      {!id || error ? (
        <p className="status-message">{error ?? 'Film introuvable.'}</p>
      ) : movie ? (
        <MovieDetailCard movie={movie} />
      ) : (
        <p className="status-message">Chargement du film...</p>
      )}
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="empty-state">
      <p className="catalog-eyebrow">Erreur 404</p>
      <h1>Cette page n'existe pas</h1>
      <p>Retournez au catalogue pour découvrir les films populaires.</p>
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
