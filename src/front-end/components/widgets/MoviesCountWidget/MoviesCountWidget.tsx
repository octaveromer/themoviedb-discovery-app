import WidgetCard, { type WidgetStatus } from '../WidgetCard/WidgetCard';

interface MoviesCountWidgetProps {
  // Number of movies in the database, or null when it is unknown
  count: number | null;
  status?: WidgetStatus;
}

// French number format, e.g. 1 234
const numberFormat = new Intl.NumberFormat('fr-FR');

/** Widget "Films en base": displays the number of movies in the database. */
export default function MoviesCountWidget({
  count,
  status = 'ready',
}: MoviesCountWidgetProps) {
  return (
    <WidgetCard title="Films en base" status={status}>
      {count === null ? (
        // An unknown count is not displayed as 0
        <p className="widget-card-message">Aucune donnée disponible.</p>
      ) : (
        <p className="widget-card-value">
          {numberFormat.format(count)}
          <span className="widget-card-unit">
            {count > 1 ? 'films' : 'film'}
          </span>
        </p>
      )}
    </WidgetCard>
  );
}
