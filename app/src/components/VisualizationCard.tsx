
import type { Visualization } from "../data/visualizations";

type Props = {
  visualization: Visualization;
  onSelect: (visualization: Visualization) => void;
};

export default function VisualizationCard({
  visualization,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      className="visualization-card"
      onClick={() => onSelect(visualization)}
    >
      <div className="card-image">
        <img
          src={`${import.meta.env.BASE_URL}${visualization.image}`}
          alt={visualization.title}
          loading="lazy"
        />
      </div>

      <div className="card-content">
        <span className="card-category">
          {visualization.category} / {visualization.season}
        </span>

        <h3>{visualization.title}</h3>
        <p>{visualization.description}</p>

        <span className="card-link">
          View Analysis →
        </span>
      </div>
    </button>
  );
}
