import ScoreRing from "./ScoreRing.jsx";
import IssueCard from "./IssueCard.jsx";
import styles from "./ReviewPanel.module.css";

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ReviewPanel({ streaming, chunks, status, result, error }) {
  if (error) {
    return (
      <div className={styles.empty}>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    );
  }

  if (!streaming && !result && !chunks) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>{"{ }"}</div>
        <p className={styles.emptyText}>Paste your code and click Review</p>
        <p className={styles.emptyHint}>Supports 17 languages · Streaming results</p>
      </div>
    );
  }

  const issues = result?.parsed?.issues
    ? [...result.parsed.issues].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      )
    : [];

  const counts = issues.reduce((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.panel}>
      {/* Status bar */}
      {(streaming || status) && (
        <div className={styles.statusBar}>
          {streaming && <span className={styles.pulse} />}
          <span className={styles.statusText}>{status || "Reviewing..."}</span>
        </div>
      )}

      {/* Streaming raw text */}
      {streaming && chunks && (
        <div className={styles.rawStream}>
          <pre className={styles.pre}>{chunks}</pre>
        </div>
      )}

      {/* Parsed result */}
      {result?.parsed && (
        <>
          <div className={styles.resultHeader}>
            <div className={styles.summary}>
              <p className={styles.summaryText}>{result.parsed.summary}</p>
              <div className={styles.stats}>
                {Object.entries(counts).map(([sev, n]) => (
                  <span key={sev} className={`badge badge-${sev}`}>
                    {n} {sev}
                  </span>
                ))}
                {result.durationMs && (
                  <span className={styles.duration}>
                    {(result.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
            {result.parsed.score != null && (
              <ScoreRing score={result.parsed.score} />
            )}
          </div>

          {issues.length > 0 ? (
            <div className={styles.issues}>
              {issues.map((issue, i) => (
                <IssueCard key={i} issue={issue} />
              ))}
            </div>
          ) : (
            <div className={styles.allClear}>
              <span className={styles.allClearIcon}>✓</span>
              <span>No issues found — great code!</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
