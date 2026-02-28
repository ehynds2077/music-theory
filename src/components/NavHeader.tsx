import { NavLink } from 'react-router';

export function NavHeader() {
  return (
    <nav className="nav-header">
      <span className="nav-title">Chromatic Spiral</span>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
          Explore
        </NavLink>
        <NavLink to="/piano-spiral" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
          Piano Spiral
        </NavLink>
        <NavLink to="/lessons/intervals" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
          Lessons
        </NavLink>
      </div>
    </nav>
  );
}
