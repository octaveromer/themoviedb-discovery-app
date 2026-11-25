import StatValue from '../StatValue/StatValue';
import WidgetCard, { type WidgetStatus } from '../WidgetCard/WidgetCard';

interface MoviesCountWidgetProps {
  // Number of movies in the database, or null when it is unknown
  count: number | null;
  status?: WidgetStatus;
}

/** Widget "Films en base": displays the number of movies in the database. */
export default function MoviesCountWidget({
  count,
  status = 'ready',
}: MoviesCountWidgetProps) {
  return (
    <WidgetCard title="Films en base" status={status}>
      <StatValue
        value={count}
        unit={count !== null && count > 1 ? 'films' : 'film'}
      />
    </WidgetCard>
  );
}
