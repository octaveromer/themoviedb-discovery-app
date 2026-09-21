import { useEffect, useState } from 'react';
import type { Movie } from '../back-end/schemas/MoviesTypes';
import MovieItem from './components/MovieItem';
import './app.css';

type MoviesApiResponse = {
  results: Movie[];
};

export default function App() {
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/movies/popular')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Impossible de récupérer les films populaires.');
        }

        return response.json() as Promise<MoviesApiResponse>;
      })
      .then((data) => setMovies(data.results))
      .catch(() => setError('Impossible de charger les films populaires.'));
  }, []);

  return (
    <main className="app-shell">
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
    </main>
  );
}
