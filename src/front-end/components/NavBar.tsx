import { Link, NavLink } from 'react-router';
import './NavBar.css';

const links = [
  { to: '/movies', label: 'Films populaires' },
  { to: '/about', label: 'À propos' },
];

export default function NavBar() {
  return (
    <nav className="navbar" aria-label="Navigation principale">
      <Link className="navbar__brand" to="/movies">
        TMDB Discovery
      </Link>
      <ul className="navbar__links">
        {links.map((link) => (
          <li key={link.to}>
            {/* NavLink sets aria-current="page" on the active link */}
            <NavLink className="navbar__link" to={link.to} end>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
