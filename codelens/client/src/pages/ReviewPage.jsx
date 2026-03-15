import { useState } from "react";
import Editor from "@monaco-editor/react";
import ReviewPanel from "../components/ReviewPanel.jsx";
import { useReviewStream } from "../hooks/useReviewStream.js";
import styles from "./ReviewPage.module.css";

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "c", "cpp",
  "go", "rust", "ruby", "php", "swift", "kotlin", "sql",
  "html", "css", "shell", "json",
];

const MODES = [
  { value: "full", label: "Full Review" },
  { value: "security", label: "Security" },
  { value: "performance", label: "Performance" },
  { value: "style", label: "Style & Quality" },
];

const EXAMPLES = {
  javascript: `// Paste your code here or use this example
function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  const result = db.execute(query);
  
  var userData = result[0];
  var temp = [];
  
  for (var i = 0; i < userData.permissions.length; i++) {
    for (var j = 0; j < allPermissions.length; j++) {
      if (userData.permissions[i] == allPermissions[j]) {
        temp.push(allPermissions[j]);
      }
    }
  }
  
  return {
    id: userData.id,
    name: userData.name,
    password: userData.password,
    permissions: temp
  };
}`,
};

export default function ReviewPage() {
  const [code, setCode] = useState(EXAMPLES.javascript);
  const [language, setLanguage] = useState("javascript");
  const [mode, setMode] = useState("full");
  const { streaming, chunks, status, result, error, startReview, reset } =
    useReviewStream();

  const handleReview = () => {
    if (!code.trim() || streaming) return;
    startReview({ code, language, mode });
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    if (!streaming) reset();
  };

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <select
            className={styles.select}
            value={language}
            onChange={handleLanguageChange}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <div className={styles.modes}>
            {MODES.map((m) => (
              <button
                key={m.value}
                className={`${styles.modeBtn} ${mode === m.value ? styles.modeActive : ""}`}
                onClick={() => setMode(m.value)}
                disabled={streaming}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarRight}>
          {result && (
            <button className="btn btn-ghost" onClick={reset}>
              Clear
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleReview}
            disabled={streaming || !code.trim()}
          >
            {streaming ? (
              <>
                <span className={styles.spinner} />
                Reviewing...
              </>
            ) : (
              "Review code"
            )}
          </button>
        </div>
      </div>

      {/* Split layout */}
      <div className={styles.split}>
        {/* Editor */}
        <div className={`card ${styles.editorPane}`}>
          <div className={styles.paneHeader}>
            <span className={styles.paneTitle}>Editor</span>
            <span className={styles.charCount}>
              {code.length.toLocaleString()} / 10,000 chars
            </span>
          </div>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val || "")}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              renderLineHighlight: "line",
              padding: { top: 16, bottom: 16 },
              wordWrap: "on",
            }}
          />
        </div>

        {/* Review panel */}
        <div className={`card ${styles.reviewPane}`}>
          <div className={styles.paneHeader}>
            <span className={styles.paneTitle}>Review</span>
            {result?.parsed?.score != null && (
              <span className={styles.scoreInline}>
                Score: {result.parsed.score}/100
              </span>
            )}
          </div>
          <div className={styles.reviewContent}>
            <ReviewPanel
              streaming={streaming}
              chunks={chunks}
              status={status}
              result={result}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
