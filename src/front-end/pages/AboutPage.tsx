import './AboutPage.css';

const technologies = [
  { name: 'TypeScript', description: 'Typage et fiabilité' },
  { name: 'React', description: 'Interface composable' },
  { name: 'Node.js + Express', description: 'API légère' },
  { name: 'Vite', description: 'Développement rapide' },
];

export default function AboutPage() {
  return (
    <section className="about-page">
      <header className="about-page__intro">
        <p className="about-page__kicker">TMDB Discovery</p>
        <h1>À propos de l'application</h1>
        <p>
          Une application de découverte de films, pensée comme une expérience
          web claire, rapide et maintenable.
        </p>
      </header>

      <section className="about-page__section">
        <div>
          <p className="about-page__kicker">Le projet</p>
          <h2>Découvrir, comparer, choisir</h2>
        </div>
        <p>
          Cette application utilise l'API de <b>T</b>he <b>M</b>ovie <b>D</b>ata
          <b>B</b>ase pour rendre les films populaires faciles à explorer. Elle
          démontre la construction d'une application complète, du front-end à
          l'API.
        </p>
      </section>

      <section className="about-page__section">
        <div>
          <p className="about-page__kicker">Fondations techniques</p>
          <h2>Une stack volontairement simple</h2>
        </div>
        <ul className="about-page__stack">
          {technologies.map((technology) => (
            <li key={technology.name}>
              <strong>{technology.name}</strong>
              <span>{technology.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-page__source">
        <div>
          <p className="about-page__kicker">Code source</p>
          <h2>Voir la réalisation du projet</h2>
        </div>
        <a
          className="about-page__source-link"
          href="https://github.com/octaveromer/themoviedb-discovery-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir le dépôt GitHub
        </a>
      </section>
    </section>
  );
}
