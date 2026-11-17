import { useId, type ReactNode } from 'react';
import './WidgetCard.css';

// Loading state of the data displayed by a widget
export type WidgetStatus = 'loading' | 'error' | 'ready';

interface WidgetCardProps {
  title: string;
  status: WidgetStatus;
  // Content displayed once the data is ready
  children?: ReactNode;
}

/**
 * Card shared by the dashboard widgets: it displays the widget title, then a
 * loading or error message, or the widget content when the data is ready.
 */
export default function WidgetCard({
  title,
  status,
  children,
}: WidgetCardProps) {
  const titleId = useId();

  return (
    <article
      className="widget-card"
      aria-labelledby={titleId}
      aria-busy={status === 'loading'}
    >
      <h2 id={titleId} className="widget-card-title">
        {title}
      </h2>
      {status === 'loading' && (
        <p className="widget-card-message">Chargement…</p>
      )}
      {status === 'error' && (
        <p className="widget-card-message widget-card-error" role="alert">
          Impossible de charger les données.
        </p>
      )}
      {status === 'ready' && children}
    </article>
  );
}
