
import json
import re
import shutil
import unicodedata
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent
REPO = BASE.parent

ROSTER_DIR = BASE / "big12_rosters"
PER_GAME_DIR = BASE / "big12_per_game"
LOGO_DIR = BASE / "big12_logos"

NIL_FILE = BASE / "the-nil-standard-basketball-team-roster-spend-2026-11-02.csv"

DATA_OUT = REPO / "app/public/data"
LOGO_OUT = REPO / "app/public/logos"

DATA_OUT.mkdir(parents=True, exist_ok=True)
LOGO_OUT.mkdir(parents=True, exist_ok=True)


def normalize_name(value):
    text = unicodedata.normalize("NFKD", str(value))
    text = "".join(
        c for c in text if not unicodedata.combining(c)
    )
    return re.sub(r"[^a-z0-9]", "", text.lower())


def height_inches(value):
    match = re.fullmatch(
        r"(\d+)-(\d+)", str(value).strip()
    )
    if not match:
        return None
    return int(match.group(1)) * 12 + int(match.group(2))


def position_group(value):
    pos = str(value).upper().strip()

    if pos in {"F", "C", "F-C", "C-F"}:
        return "frontcourt"

    if pos in {"G-F", "F-G"}:
        return "hybrid"

    return "backcourt"


nil_df = pd.read_csv(NIL_FILE)
big12_df = nil_df[
    nil_df["conference"] == "Big 12"
].copy()

teams = []

for _, row in big12_df.iterrows():

    team = row["team"]
    stem = team.lower().replace(" ", "_")

    roster_path = ROSTER_DIR / f"{stem}.csv"
    per_game_path = PER_GAME_DIR / f"{stem}.csv"

    if not roster_path.exists() or not per_game_path.exists():
        raise FileNotFoundError(f"Missing data for {team}")

    roster = pd.read_csv(roster_path)
    per_game = pd.read_csv(per_game_path)

    for frame in [roster, per_game]:
        frame.columns = frame.columns.astype(str).str.strip()

        frame.drop(
            frame[
                frame["Player"].isna()
                | frame["Player"].astype(str).str.strip().isin(
                    ["Player", "Team Totals", "Opponent Totals"]
                )
            ].index,
            inplace=True
        )

        frame["key"] = frame["Player"].apply(normalize_name)

        if frame["key"].duplicated().any():
            raise ValueError(
                f"Duplicate normalized player names: {team}"
            )

    roster["height_inches"] = roster["Height"].apply(
        height_inches
    )

    # Preserve roster players who have no Per Game entry
    merged = roster.merge(
        per_game.drop(
            columns=["Player", "Pos"],
            errors="ignore"
        ),
        on="key",
        how="left",
        validate="one_to_one",
        indicator=True
    )

    unmatched = merged.loc[
        merged["_merge"] == "left_only", "Player"
    ].tolist()

    if unmatched:
        print(f"{team} unmatched players: {unmatched}")

    # MP already means minutes per game
    numeric_columns = [
        "G", "GS", "MP", "PTS", "TRB",
        "AST", "STL", "BLK"
    ]

    for col in numeric_columns:
        if col not in merged.columns:
            merged[col] = 0

        merged[col] = pd.to_numeric(
            merged[col],
            errors="coerce"
        ).fillna(0)

    merged["MPG"] = merged["MP"]
    merged["position_group"] = merged["Pos"].apply(
        position_group
    )

    # Default rotation: top 8 by MPG
    eligible = merged[
        (merged["MPG"] > 0)
        & merged["height_inches"].notna()
    ].sort_values(
        ["MPG", "G", "GS"],
        ascending=[False, False, False]
    )

    top8 = set(eligible.head(8)["key"])

    # Frontcourt: top 3 strict F/C players by MPG
    frontcourt = eligible[
        eligible["position_group"] == "frontcourt"
    ]

    top3_frontcourt = set(
        frontcourt.head(3)["key"]
    )

    players = []

    for _, p in merged.iterrows():

        height = p["height_inches"]

        players.append({
            "id": f"{stem}-{p['key']}",
            "name": str(p["Player"]),
            "position": str(p["Pos"]),
            "position_group": p["position_group"],
            "height_inches": (
                int(height) if pd.notna(height) else None
            ),
            "games": int(p["G"]),
            "games_started": int(p["GS"]),
            "mpg": round(float(p["MPG"]), 2),
            "ppg": round(float(p["PTS"]), 2),
            "rpg": round(float(p["TRB"]), 2),
            "apg": round(float(p["AST"]), 2),
            "spg": round(float(p["STL"]), 2),
            "bpg": round(float(p["BLK"]), 2),
            "default_top8": p["key"] in top8,
            "default_frontcourt": (
                p["key"] in top3_frontcourt
            ),
        })

    logo_source = LOGO_DIR / f"{stem}_logo.png"
    logo_name = f"{stem}_logo.png"

    logo_path = None

    if logo_source.exists():
        shutil.copy2(
            logo_source,
            LOGO_OUT / logo_name
        )
        logo_path = f"logos/{logo_name}"
    else:
        print(f"Missing logo: {team}")

    teams.append({
        "team": team,
        "conference": "Big 12",
        "season": "2026-27",
        "nil_spend_usd": int(row["est_roster_spend_usd"]),
        "logo": logo_path,
        "players": players,
    })

    print(
        f"{team}: {len(players)} players, "
        f"{len(top8)} rotation players, "
        f"{len(top3_frontcourt)} frontcourt players"
    )

if len(teams) != 16:
    raise ValueError(
        f"Expected 16 teams, found {len(teams)}"
    )

output = DATA_OUT / "big12_2027.json"

output.write_text(
    json.dumps(
        {"teams": teams},
        indent=2,
        ensure_ascii=False,
        allow_nan=False
    ),
    encoding="utf-8"
)

print(f"\nSaved: {output}")
print(f"Teams exported: {len(teams)}")
