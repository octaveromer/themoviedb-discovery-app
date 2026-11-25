import type { ReactNode } from 'react';
import './DashboardPage.css';

interface DashboardPageProps {
  // Widgets to display; the page shows an empty state when there is none
  children?: ReactNode;
}

export default function DashboardPage({ children }: DashboardPageProps) {
  return (
    <main className="app-shell dashboard-page">
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <p className="dashboard-intro">
          Une vue d'ensemble des films enregistrés, de leurs genres et de leurs
          pays de production.
        </p>
      </header>

      <section className="dashboard-widgets" aria-label="Widgets">
        {children ?? (
          <p className="dashboard-empty">
            Aucun widget n'est encore configuré.
          </p>
        )}
      </section>
    </main>
  );
}
