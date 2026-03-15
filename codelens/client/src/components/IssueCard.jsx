import { useState } from "react";
import styles from "./IssueCard.module.css";

export default function IssueCard({ issue }) {
  const [open, setOpen] = useState(false);
  const { severity, line, title, description, suggestion } = issue;

  return (
    <div className={`${styles.card} ${styles[severity]}`}>
      <button className={styles.header} onClick={() => setOpen(!open)}>
        <span className={`badge badge-${severity}`}>{severity}</span>
        {line && <span className={styles.line}>L{line}</span>}
        <span className={styles.title}>{title}</span>
        <span className={styles.chevron}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className={styles.body}>
          <p className={styles.desc}>{description}</p>
          {suggestion && (
            <div className={styles.suggestion}>
              <span className={styles.suggestionLabel}>Suggestion</span>
              <p>{suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
