import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import styles from "./Layout.module.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>{"</>"}</span>
            <span className={styles.logoText}>CodeLens</span>
          </div>
          <nav className={styles.nav}>
            <NavLink to="/" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}>
              Review
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}>
              History
            </NavLink>
          </nav>
          <div className={styles.userArea}>
            <span className={styles.userName}>{user?.name}</span>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: "5px 12px" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
