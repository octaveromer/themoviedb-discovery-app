interface StatValueProps {
  /** Value to display, or `null` when it is unknown. */
  value: number | null;
  /** Unit written after the value, e.g. "min". */
  unit: string;
  /** Maximum number of decimals displayed, 0 by default. */
  maximumFractionDigits?: number;
  /** Minimum number of decimals displayed, completed with zeros: 0 by default. */
  minimumFractionDigits?: number;
}

/**
 * Main value of a dashboard widget, in the French number format, followed by its unit.
 * An unknown value is displayed as a "no data" message, never as 0.
 */
export default function StatValue({
  value,
  unit,
  maximumFractionDigits = 0,
  minimumFractionDigits = 0,
}: StatValueProps) {
  if (value === null) {
    return <p className="widget-card-message">Aucune donnée disponible.</p>;
  }

  // The maximum can not be lower than the minimum, e.g. exactly 2 decimals
  const formattedValue = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits,
    maximumFractionDigits: Math.max(
      maximumFractionDigits,
      minimumFractionDigits,
    ),
  }).format(value);

  return (
    <p className="widget-card-value">
      {formattedValue}
      <span className="widget-card-unit">{unit}</span>
    </p>
  );
}
