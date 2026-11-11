
import { useState } from "react";
import VisualizationCard from "../src/components/VisualizationCard";
import {
  visualizations,
  type Visualization,
} from "./data/visualizations";

import "./App.css";

type Category = "All" | "NIL" | "Players" | "Coaching";

function App() {
  const [selected, setSelected] = useState<Visualization | null>(null);
  const [category, setCategory] = useState<Category>("All");

  const filtered = visualizations.filter(
    (item) => category === "All" || item.category === category
  );

  const imageUrl = (path: string) =>
    `${import.meta.env.BASE_URL}${path}`;

  return (
    <div className="app">
      <header className="site-header">
        <button
          className="brand"
          onClick={() => setSelected(null)}
        >
          <span className="brand-mark">BB</span>
          <span>BUFFS BASKETBALL</span>
        </button>

        <span className="header-label">
          DATA & ANALYTICS
        </span>
      </header>

      {selected === null ? (
        <main>
          <section className="hero">
            <span className="eyebrow">
              COLLEGE BASKETBALL ANALYTICS
            </span>

            <h1>Basketball, through the numbers.</h1>

            <p>
              Exploring NIL spending, player performance,
              roster construction, and coaching through
              data-driven visualizations.
            </p>
          </section>

          <section className="gallery-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">EXPLORE</span>
                <h2>Analytics Projects</h2>
              </div>

              <span className="project-count">
                {filtered.length} projects
              </span>
            </div>

            <div className="filter-bar">
              {(["All", "NIL", "Players", "Coaching"] as Category[])
                .map((item) => (
                  <button
                    key={item}
                    className={
                      category === item
                        ? "filter-button active"
                        : "filter-button"
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item === "All" ? "All Projects" : item}
                  </button>
                ))}
            </div>

            {filtered.length > 0 ? (
              <div className="gallery-grid">
                {filtered.map((visualization) => (
                  <VisualizationCard
                    key={visualization.id}
                    visualization={visualization}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>More analyses coming soon.</h3>
                <p>
                  New visualizations will appear here
                  as they're published.
                </p>
              </div>
            )}
          </section>
        </main>
      ) : (
        <main className="detail-page">
          <button
            className="back-button"
            onClick={() => setSelected(null)}
          >
            ← Back to Projects
          </button>

          <span className="eyebrow">
            {selected.category} ANALYSIS / {selected.season}
          </span>

          <h1>{selected.title}</h1>
          <p className="detail-description">
            {selected.description}
          </p>

          <div className="detail-image-container">
            <img
              src={imageUrl(selected.image)}
              alt={selected.title}
              className="detail-image"
            />
          </div>

          <div className="detail-information">
            <h2>Methodology</h2>
            <p>{selected.methodology}</p>
          </div>
        </main>
      )}

      <footer className="site-footer">
        <span>BUFFS BASKETBALL ANALYTICS</span>
        <span>Independent college basketball research</span>
      </footer>
    </div>
  );
}

export default App;
