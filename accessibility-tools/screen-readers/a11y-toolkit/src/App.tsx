import { useState, useEffect, useRef } from 'react';
import { runAudit, ScreenReaderSimulator, checkContrast, type A11yIssue, type Announcement } from './index';

const styles = {
  app: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '2rem',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#666',
    fontSize: '1rem',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    background: '#f5f5f5',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  tabActive: {
    background: '#007bff',
    color: 'white',
  },
  card: {
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: '1.25rem',
    marginBottom: '15px',
    color: '#333',
  },
  button: {
    padding: '12px 24px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginRight: '10px',
  },
  issueList: {
    listStyle: 'none',
    padding: 0,
  },
  issue: {
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    borderLeft: '4px solid',
  },
  issueCritical: {
    background: '#fff5f5',
    borderColor: '#dc3545',
  },
  issueSerious: {
    background: '#fff8e6',
    borderColor: '#ffc107',
  },
  issueModerate: {
    background: '#e6f3ff',
    borderColor: '#17a2b8',
  },
  issueMinor: {
    background: '#f5f5f5',
    borderColor: '#6c757d',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginRight: '8px',
  },
  testArea: {
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '8px',
    marginTop: '20px',
  },
  announcement: {
    padding: '10px 15px',
    background: '#e8f4fd',
    borderRadius: '6px',
    marginBottom: '8px',
    fontSize: '0.9rem',
  },
  contrastBox: {
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center' as const,
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    marginRight: '10px',
    width: '120px',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'audit' | 'reader' | 'contrast'>('audit');
  const [auditResults, setAuditResults] = useState<A11yIssue[]>([]);
  const [passes, setPasses] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fgColor, setFgColor] = useState('#333333');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [contrastRatio, setContrastRatio] = useState<number | null>(null);

  const simulatorRef = useRef<ScreenReaderSimulator | null>(null);

  useEffect(() => {
    simulatorRef.current = new ScreenReaderSimulator();
  }, []);

  const runAccessibilityAudit = () => {
    const result = runAudit(document);
    setAuditResults(result.violations);
    setPasses(result.passes);
  };

  const announceElement = (element: Element) => {
    if (simulatorRef.current) {
      const announcement = simulatorRef.current.announce(element);
      setAnnouncements((prev) => [announcement, ...prev.slice(0, 9)]);
    }
  };

  const checkColorContrast = () => {
    try {
      const result = checkContrast(fgColor, bgColor);
      setContrastRatio(result.ratio);
    } catch {
      setContrastRatio(null);
    }
  };

  useEffect(() => {
    checkColorContrast();
  }, [fgColor, bgColor]);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return styles.issueCritical;
      case 'serious':
        return styles.issueSerious;
      case 'moderate':
        return styles.issueModerate;
      default:
        return styles.issueMinor;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { background: '#dc3545', color: 'white' };
      case 'serious':
        return { background: '#ffc107', color: 'black' };
      case 'moderate':
        return { background: '#17a2b8', color: 'white' };
      default:
        return { background: '#6c757d', color: 'white' };
    }
  };

  return (
    <main style={styles.app} role="main">
      <header style={styles.header}>
        <h1 style={styles.title}>Accessibility Toolkit</h1>
        <p style={styles.subtitle}>Test and improve your website's accessibility</p>
      </header>

      <nav style={styles.tabs} role="tablist" aria-label="Toolkit sections">
        <button
          role="tab"
          aria-selected={activeTab === 'audit'}
          style={{ ...styles.tab, ...(activeTab === 'audit' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('audit')}
        >
          Audit
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'reader'}
          style={{ ...styles.tab, ...(activeTab === 'reader' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('reader')}
        >
          Screen Reader
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'contrast'}
          style={{ ...styles.tab, ...(activeTab === 'contrast' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('contrast')}
        >
          Contrast Checker
        </button>
      </nav>

      {activeTab === 'audit' && (
        <section aria-labelledby="audit-title">
          <div style={styles.card}>
            <h2 id="audit-title" style={styles.cardTitle}>Accessibility Audit</h2>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Run an automated check for common accessibility issues on this page.
            </p>
            <button style={styles.button} onClick={runAccessibilityAudit}>
              Run Audit
            </button>
            {auditResults.length > 0 && (
              <p style={{ marginTop: '15px' }}>
                Found <strong>{auditResults.length}</strong> issues,{' '}
                <strong>{passes}</strong> rules passed
              </p>
            )}
          </div>

          {auditResults.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Issues Found</h3>
              <ul style={styles.issueList} role="list">
                {auditResults.map((issue, index) => (
                  <li
                    key={index}
                    style={{ ...styles.issue, ...getSeverityStyle(issue.severity) }}
                  >
                    <span style={{ ...styles.badge, ...getSeverityBadgeColor(issue.severity) }}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <strong>{issue.rule}</strong>
                    <p style={{ margin: '8px 0', color: '#555' }}>{issue.message}</p>
                    <code style={{ fontSize: '0.85rem', color: '#666' }}>{issue.selector}</code>
                    <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#007bff' }}>
                      💡 {issue.help}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {activeTab === 'reader' && (
        <section aria-labelledby="reader-title">
          <div style={styles.card}>
            <h2 id="reader-title" style={styles.cardTitle}>Screen Reader Simulator</h2>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Click on elements below to see how a screen reader would announce them.
            </p>

            <div style={styles.testArea}>
              <h3>Test Elements</h3>
              <p style={{ marginTop: '10px' }}>
                <button
                  onClick={(e) => announceElement(e.currentTarget)}
                  aria-label="Submit form"
                >
                  Submit Button
                </button>{' '}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); announceElement(e.currentTarget); }}
                >
                  Example Link
                </a>
              </p>
              <p style={{ marginTop: '10px' }}>
                <label htmlFor="test-input">Name: </label>
                <input
                  id="test-input"
                  type="text"
                  placeholder="Enter name"
                  onFocus={(e) => announceElement(e.currentTarget)}
                />
              </p>
              <p style={{ marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="test-checkbox"
                  aria-checked="false"
                  onFocus={(e) => announceElement(e.currentTarget)}
                />
                <label htmlFor="test-checkbox"> Subscribe to newsletter</label>
              </p>
              <div
                role="img"
                aria-label="Company logo"
                style={{ padding: '20px', background: '#ddd', display: 'inline-block', cursor: 'pointer' }}
                tabIndex={0}
                onFocus={(e) => announceElement(e.currentTarget)}
                onClick={(e) => announceElement(e.currentTarget)}
              >
                [Image placeholder]
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Announcements</h3>
            {announcements.length === 0 ? (
              <p style={{ color: '#666' }}>Click or focus on elements above to see announcements</p>
            ) : (
              announcements.map((a, i) => (
                <div key={i} style={styles.announcement}>
                  <strong>"{a.text}"</strong>
                  <span style={{ marginLeft: '10px', color: '#666', fontSize: '0.85rem' }}>
                    ({a.role})
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'contrast' && (
        <section aria-labelledby="contrast-title">
          <div style={styles.card}>
            <h2 id="contrast-title" style={styles.cardTitle}>Color Contrast Checker</h2>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Check if your color combination meets WCAG accessibility standards.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label>
                Foreground:{' '}
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  style={{ marginRight: '10px' }}
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  style={styles.input}
                />
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>
                Background:{' '}
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ marginRight: '10px' }}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={styles.input}
                />
              </label>
            </div>

            <div
              style={{
                ...styles.contrastBox,
                background: bgColor,
                color: fgColor,
              }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Sample Text</p>
              <p>This is how your text will look with these colors.</p>
            </div>

            {contrastRatio !== null && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
                  Contrast Ratio: <strong>{contrastRatio.toFixed(2)}:1</strong>
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Level</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Normal Text</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Large Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>AA</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        {contrastRatio >= 4.5 ? '✅ Pass' : '❌ Fail'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        {contrastRatio >= 3 ? '✅ Pass' : '❌ Fail'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px' }}>AAA</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {contrastRatio >= 7 ? '✅ Pass' : '❌ Fail'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {contrastRatio >= 4.5 ? '✅ Pass' : '❌ Fail'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
