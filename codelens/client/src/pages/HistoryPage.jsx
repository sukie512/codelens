import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import styles from "./HistoryPage.module.css";

const SEVERITY_COLORS = {
  critical: "var(--red)",
  high: "var(--orange)",
  medium: "var(--yellow)",
  low: "var(--green)",
};

function scoreColor(score) {
  if (score >= 80) return "var(--green)";
  if (score >= 50) return "var(--yellow)";
  return "var(--red)";
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/history?page=${p}&limit=10`);
      setReviews(res.data.reviews);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this review?")) return;
    setDeleting(id);
    try {
      await api.delete(`/history/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Review history</h1>
          <p className={styles.subtitle}>{total} total reviews</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          New review
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className={styles.empty}>
          <p>No reviews yet.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Start your first review
          </button>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {reviews.map((r) => (
              <div key={r._id} className={`card ${styles.row}`}>
                <div className={styles.rowLeft}>
                  <div className={styles.langBadge}>{r.language}</div>
                  <div className={styles.rowInfo}>
                    <div className={styles.rowMeta}>
                      <span className={styles.mode}>{r.mode} review</span>
                      <span className={styles.time}>{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className={styles.rowSummary}>{r.summary || "No summary"}</p>
                    <div className={styles.issueSummary}>
                      {["critical", "high", "medium", "low"].map((sev) => {
                        const count = r.issues?.filter((i) => i.severity === sev).length;
                        if (!count) return null;
                        return (
                          <span key={sev} className={styles.issueCount} style={{ color: SEVERITY_COLORS[sev] }}>
                            {count} {sev}
                          </span>
                        );
                      })}
                      {(!r.issues || r.issues.length === 0) && (
                        <span style={{ color: "var(--green)", fontSize: 12 }}>No issues</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.rowRight}>
                  {r.score != null && (
                    <div className={styles.score} style={{ color: scoreColor(r.score) }}>
                      <span className={styles.scoreNum}>{r.score}</span>
                      <span className={styles.scoreLabel}>/100</span>
                    </div>
                  )}
                  <button
                    className={`btn btn-ghost ${styles.deleteBtn}`}
                    onClick={(e) => handleDelete(r._id, e)}
                    disabled={deleting === r._id}
                    title="Delete"
                  >
                    {deleting === r._id ? "..." : "✕"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className={styles.pagination}>
              <button className="btn btn-ghost" onClick={() => fetchHistory(page - 1)} disabled={page <= 1}>
                ← Prev
              </button>
              <span className={styles.pageInfo}>Page {page} of {pages}</span>
              <button className="btn btn-ghost" onClick={() => fetchHistory(page + 1)} disabled={page >= pages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
