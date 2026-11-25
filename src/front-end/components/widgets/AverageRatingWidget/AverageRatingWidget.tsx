import StatValue from '../StatValue/StatValue';
import WidgetCard, { type WidgetStatus } from '../WidgetCard/WidgetCard';

export interface AverageRatingWidgetProps {
  /**
   * Simple average of the movie ratings, on a scale of 10, already computed on
   * every rated movie of the database. `null` when no movie is rated: it is never shown as 0.
   */
  averageRating: number | null;
  /** Loading state of the data: `ready` by default. */
  status?: WidgetStatus;
}

/**
 * Widget "Note moyenne": displays the simple average rating of the movies,
 * with two decimals and the "/ 10" scale. It is not a weighted rating and the
 * widget does not compute it.
 */
export default function AverageRatingWidget({
  averageRating,
  status = 'ready',
}: AverageRatingWidgetProps) {
  return (
    <WidgetCard title="Note moyenne" status={status}>
      <StatValue value={averageRating} unit="/ 10" minimumFractionDigits={2} />
      {averageRating !== null && (
        // Distinguishes this simple average from a weighted rating
        <p className="widget-card-caption">Moyenne simple des notes</p>
      )}
    </WidgetCard>
  );
}
