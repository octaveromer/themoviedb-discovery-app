import StatValue from '../StatValue/StatValue';
import WidgetCard, { type WidgetStatus } from '../WidgetCard/WidgetCard';

/** Country with the most movies, as computed by the data source. */
export interface TopCountry {
  /** Name of the country, e.g. "United States of America". */
  name: string;
  /** Number of movies produced in this country. */
  movieCount: number;
}

export interface TopCountryWidgetProps {
  /**
   * Most represented production country, already computed: the widget does not
   * count the links between movies and countries. `null` when no country is known.
   */
  topCountry: TopCountry | null;
  /** Loading state of the data: `ready` by default. */
  status?: WidgetStatus;
}

/**
 * Widget "Pays le plus représenté": displays the production country with the
 * most movies and its number of movies.
 */
export default function TopCountryWidget({
  topCountry,
  status = 'ready',
}: TopCountryWidgetProps) {
  return (
    <WidgetCard title="Pays le plus représenté" status={status}>
      {topCountry === null ? (
        <p className="widget-card-message">Aucun pays connu.</p>
      ) : (
        <>
          <p className="widget-card-highlight">{topCountry.name}</p>
          <StatValue
            value={topCountry.movieCount}
            unit={topCountry.movieCount > 1 ? 'films' : 'film'}
          />
        </>
      )}
    </WidgetCard>
  );
}
