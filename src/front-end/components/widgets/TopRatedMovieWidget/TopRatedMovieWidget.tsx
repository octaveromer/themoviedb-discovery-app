import MovieHighlight, {
  type WidgetMovie,
} from '../MovieHighlight/MovieHighlight';
import StatValue from '../StatValue/StatValue';
import WidgetCard, { type WidgetStatus } from '../WidgetCard/WidgetCard';

/** Best rated movie, with its rating. */
export interface TopRatedMovie extends WidgetMovie {
  /** Rating of the movie, on a scale of 10. */
  rating: number;
}

export interface TopRatedMovieWidgetProps {
  /**
   * Best rated movie, already selected by the data source: the widget does not
   * compare the movies. `null` when no movie is rated.
   */
  movie: TopRatedMovie | null;
  /** Loading state of the data: `ready` by default. */
  status?: WidgetStatus;
}

/**
 * Widget "Film le mieux noté": displays the poster, title, year and rating
 * of the best rated movie, with one decimal and the "/ 10" scale.
 */
export default function TopRatedMovieWidget({
  movie,
  status = 'ready',
}: TopRatedMovieWidgetProps) {
  return (
    <WidgetCard title="Film le mieux noté" status={status}>
      {movie === null ? (
        <p className="widget-card-message">Aucun film noté.</p>
      ) : (
        <MovieHighlight
          title={movie.title}
          posterPath={movie.posterPath}
          releaseYear={movie.releaseYear}
        >
          <StatValue
            value={movie.rating}
            unit="/ 10"
            minimumFractionDigits={1}
          />
        </MovieHighlight>
      )}
    </WidgetCard>
  );
}
