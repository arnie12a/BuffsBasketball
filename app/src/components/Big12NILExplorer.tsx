
import { useEffect, useMemo, useRef, useState } from "react";
import NILScatterPlot from "./NILScatterPlot";
import { toPng } from "html-to-image";
import "./Big12NILExplorer.css";

// ----------------------------------------------------
// Types matching big12_2027.json
// ----------------------------------------------------

type Player = {
  id: string;
  name: string;
  position: string;
  position_group: string;
  height_inches: number | null;
  games: number;
  games_started: number;
  mpg: number;
  ppg: number;
  rpg: number;
  apg: number;
  default_top8: boolean;
  default_frontcourt: boolean;
};

type Team = {
  team: string;
  conference: string;
  season: string;
  nil_spend_usd: number;
  logo: string | null;
  players: Player[];
};

type Dataset = {
  teams: Team[];
};

type Point = {
  team: string;
  height: number;
  spend: number;
  count: number;
  logo: string | null;
};

type Mode = "rotation" | "frontcourt" | "custom";

const BASE = import.meta.env.BASE_URL;

// ----------------------------------------------------
// Helper functions
// ----------------------------------------------------

function formatHeight(value: number | null): string {
  if (value === null) return "—";

  const inches = Math.round(value);

  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function averageHeight(players: Player[]): number | null {
  const heights = players
    .map((player) => player.height_inches)
    .filter((height): height is number => height !== null);

  if (heights.length === 0) return null;

  return (
    heights.reduce((sum, height) => sum + height, 0) /
    heights.length
  );
}

function getPreset(
  teams: Team[],
  mode: "rotation" | "frontcourt"
): Record<string, string[]> {
  return Object.fromEntries(
    teams.map((team) => [
      team.team,
      team.players
        .filter((player) =>
          mode === "rotation"
            ? player.default_top8
            : player.default_frontcourt
        )
        .map((player) => player.id),
    ])
  );
}

// ----------------------------------------------------
// Main component
// ----------------------------------------------------

export default function Big12NILExplorer() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("Colorado");

  const [selections, setSelections] = useState<
    Record<string, string[]>
  >({});

  const [mode, setMode] = useState<Mode>("rotation");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const chartRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------
  // Load JSON data
  // ----------------------------------------------------

  useEffect(() => {
    fetch(`${BASE}data/big12_2027.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load JSON: ${response.status}`);
        }

        return response.json() as Promise<Dataset>;
      })
      .then((data) => {
        setTeams(data.teams);
        setSelections(getPreset(data.teams, "rotation"));
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  // ----------------------------------------------------
  // Selected team and players
  // ----------------------------------------------------

  const currentTeam = teams.find(
    (team) => team.team === selectedTeam
  );

  const selectedIds = selections[selectedTeam] || [];

  const selectedPlayers = useMemo(() => {
    if (!currentTeam) return [];

    return currentTeam.players.filter((player) =>
      selectedIds.includes(player.id)
    );
  }, [currentTeam, selectedIds]);

  const currentAverage = averageHeight(selectedPlayers);

  // ----------------------------------------------------
  // Calculate all team positions on scatter plot
  // ----------------------------------------------------

  const plotData = useMemo<Point[]>(() => {
    return teams.flatMap((team) => {
      const ids = selections[team.team] || [];

      const players = team.players.filter((player) =>
        ids.includes(player.id)
      );

      const height = averageHeight(players);

      if (height === null) return [];

      return [
        {
          team: team.team,
          height,
          spend: team.nil_spend_usd / 1_000_000,
          count: players.length,
          logo: team.logo,
        },
      ];
    });
  }, [teams, selections]);

  console.log("Teams loaded:", teams.length);
console.log("Plot data:", plotData);

  // ----------------------------------------------------
  // Rankings
  // ----------------------------------------------------

  const rankings = useMemo(() => {
    return [...plotData].sort(
      (a, b) => b.height - a.height
    );
  }, [plotData]);

  // ----------------------------------------------------
  // Analysis modes
  // ----------------------------------------------------

  function changeMode(nextMode: Mode) {
    setMode(nextMode);

    if (nextMode !== "custom") {
      setSelections(getPreset(teams, nextMode));
    }
  }

  function togglePlayer(playerId: string) {
    setMode("custom");

    setSelections((previous) => {
      const current = previous[selectedTeam] || [];

      const updated = current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId];

      return {
        ...previous,
        [selectedTeam]: updated,
      };
    });
  }

  function resetTeam() {
    if (!currentTeam) return;

    const presetMode =
      mode === "frontcourt" ? "frontcourt" : "rotation";

    const defaults = getPreset(
      [currentTeam],
      presetMode
    );

    setSelections((previous) => ({
      ...previous,
      [selectedTeam]: defaults[selectedTeam],
    }));
  }

  function resetAll() {
    setMode("rotation");
    setSelections(getPreset(teams, "rotation"));
  }

  // ----------------------------------------------------
  // Export chart as PNG
  // ----------------------------------------------------

  async function exportChart() {
    if (!chartRef.current) return;

    try {
      const image = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.href = image;
      link.download = "big12_nil_height_custom.png";
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Unable to export the chart.");
    }
  }

  // ----------------------------------------------------
  // Loading / error states
  // ----------------------------------------------------

  if (loading) {
    return (
      <div className="nil-explorer">
        Loading Big 12 NIL data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="nil-explorer">
        Error loading data: {error}
      </div>
    );
  }

  // ----------------------------------------------------
  // Chart bounds
  // ----------------------------------------------------




  // ----------------------------------------------------
  // Render
  // ----------------------------------------------------

  return (
    <div className="nil-explorer">

      <header className="nil-header">
        <span>BIG 12 CONFERENCE · 2026–27</span>

        <h1>NIL Roster Explorer</h1>

        <p>
          Explore the relationship between estimated NIL roster
          spending and average player height across all 16
          Big 12 basketball teams.
        </p>
      </header>

      {/* Analysis mode buttons */}

      <div className="nil-modes">

        <button
          className={mode === "rotation" ? "active" : ""}
          onClick={() => changeMode("rotation")}
        >
          Top 8 by MPG
        </button>

        <button
          className={mode === "frontcourt" ? "active" : ""}
          onClick={() => changeMode("frontcourt")}
        >
          Frontcourt Top 3
        </button>

        <button
          className={mode === "custom" ? "active" : ""}
          onClick={() => changeMode("custom")}
        >
          Custom Selection
        </button>

        <button onClick={resetAll}>
          Reset All
        </button>

      </div>

      <div className="nil-layout">

        {/* LEFT: Scatter plot and rankings */}

        <div className="nil-main">

          <section className="nil-panel">

            <div className="nil-panel-heading">

              <div>
                <h2>NIL Spending vs. Average Height</h2>

                <p>
                  Select a team logo to inspect its roster.
                  Add or remove players to update the graph.
                </p>
              </div>

              <button onClick={exportChart}>
                Export PNG
              </button>

            </div>

            <div ref={chartRef} className="nil-chart">
                <NILScatterPlot
                    points={plotData}
                    onSelectTeam={setSelectedTeam}
                />
                </div>

            <p className="nil-note">
              NIL spending represents estimated full-roster
              spending and does not change when player
              selections are modified.
            </p>

          </section>

          {/* Rankings */}

          <section className="nil-panel">

            <h2>Big 12 Height Rankings</h2>

            <div className="nil-rankings">

              {rankings.map((point, index) => (

                <button
                  key={point.team}
                  className={
                    selectedTeam === point.team
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelectedTeam(point.team)
                  }
                >

                  <span>{index + 1}.</span>

                  <strong>{point.team}</strong>

                  <span>{formatHeight(point.height)}</span>

                </button>

              ))}

            </div>

          </section>

        </div>

        {/* RIGHT: Team and player selection */}

        <aside className="nil-panel nil-sidebar">

          <label htmlFor="nil-team-select">
            SELECT TEAM
          </label>

          <select
            id="nil-team-select"
            value={selectedTeam}
            onChange={(event) =>
              setSelectedTeam(event.target.value)
            }
          >

            {teams.map((team) => (
              <option
                key={team.team}
                value={team.team}
              >
                {team.team}
              </option>
            ))}

          </select>

          <h2>{selectedTeam}</h2>

          <div className="nil-summary">

            <div>
              <small>AVERAGE HEIGHT</small>

              <strong>
                {formatHeight(currentAverage)}
              </strong>
            </div>

            <div>
              <small>ESTIMATED NIL</small>

              <strong>
                ${(
                  (currentTeam?.nil_spend_usd || 0) /
                  1_000_000
                ).toFixed(2)}M
              </strong>
            </div>

          </div>

          <div className="nil-player-title">

            <h3>
              Included Players ({selectedPlayers.length})
            </h3>

            <button onClick={resetTeam}>
              Reset Team
            </button>

          </div>

          <div className="nil-player-list">

            {[...(currentTeam?.players || [])]
              .sort((a, b) => b.mpg - a.mpg)
              .map((player) => (

                <label
                  key={player.id}
                  className="nil-player"
                >

                  <input
                    type="checkbox"
                    checked={selectedIds.includes(player.id)}
                    disabled={player.height_inches === null}
                    onChange={() =>
                      togglePlayer(player.id)
                    }
                  />

                  <span>

                    <strong>{player.name}</strong>

                    <small>
                      {player.position} ·{" "}
                      {player.mpg.toFixed(1)} MPG
                    </small>

                  </span>

                  <span>
                    {formatHeight(player.height_inches)}
                  </span>

                </label>

              ))}

          </div>

        </aside>

      </div>

      <p className="nil-note">
        Sources: Sports Reference and The NIL Standard.
        NIL figures are estimates, not verified payments.
        Custom player selections represent hypothetical
        roster comparisons.
      </p>

    </div>
  );
}
