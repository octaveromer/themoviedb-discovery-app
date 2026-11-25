import MovieHighlight, {
  type WidgetMovie,
} from '../MovieHighlight/MovieHighlight';
import StatValue from '../StatValue/StatValue';
import WidgetCard, { type WidgetStatus } from '../WidgetCard/WidgetCard';

/** Most popular movie, with its popularity index. */
export interface MostPopularMovie extends WidgetMovie {
  /**
   * TMDB popularity index: it is neither a rating on a scale of 10 nor a number
   * of votes. `null` when it is unknown.
   */
  popularity: number | null;
}

export interface MostPopularMovieWidgetProps {
  /**
   * Most popular movie, already selected by the data source: the widget does not
   * compare the movies. `null` when no movie is available.
   */
  movie: MostPopularMovie | null;
  /** Loading state of the data: `ready` by default. */
  status?: WidgetStatus;
}

/**
 * Widget "Film le plus populaire": displays the poster, title and year of the
 * most popular movie and its TMDB popularity index, with two decimals.
 */
export default function MostPopularMovieWidget({
  movie,
  status = 'ready',
}: MostPopularMovieWidgetProps) {
  return (
    <WidgetCard title="Film le plus populaire" status={status}>
      {movie === null ? (
        <p className="widget-card-message">Aucun film disponible.</p>
      ) : (
        <MovieHighlight
          title={movie.title}
          posterPath={movie.posterPath}
          releaseYear={movie.releaseYear}
        >
          <StatValue
            value={movie.popularity}
            unit="popularité"
            minimumFractionDigits={2}
          />
          {movie.popularity !== null && (
            // Avoids confusing the index with a rating or a number of votes
            <p className="widget-card-caption">Indice de popularité TMDB</p>
          )}
        </MovieHighlight>
      )}
    </WidgetCard>
  );
}
