import StatValue from '../StatValue/StatValue';
import WidgetCard, { type WidgetStatus } from '../WidgetCard/WidgetCard';

export interface AverageRuntimeWidgetProps {
  /**
   * Average runtime of the movies, in minutes, already computed on the valid
   * runtimes only. `null` when no movie has a known runtime: it is never shown as 0.
   */
  averageRuntime: number | null;
  /** Loading state of the data: `ready` by default. */
  status?: WidgetStatus;
}

/**
 * Widget "Durée moyenne": displays the average runtime of the movies, in minutes.
 * The value is displayed as provided, rounded to the minute; the widget does not compute it.
 */
export default function AverageRuntimeWidget({
  averageRuntime,
  status = 'ready',
}: AverageRuntimeWidgetProps) {
  return (
    <WidgetCard title="Durée moyenne" status={status}>
      <StatValue value={averageRuntime} unit="min" />
    </WidgetCard>
  );
}
