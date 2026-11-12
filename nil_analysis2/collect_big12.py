
import argparse
import io
import re
import time
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup
from PIL import Image

BASE = Path(__file__).resolve().parent
SEASON = 2027

NIL_FILE = BASE / "the-nil-standard-basketball-team-roster-spend-2026-11-02.csv"

ROSTER_DIR = BASE / "big12_rosters"
PER_GAME_DIR = BASE / "big12_per_game"
LOGO_DIR = BASE / "big12_logos"

for directory in [ROSTER_DIR, PER_GAME_DIR, LOGO_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

TEAM_MAPPING = {
    "BYU": "brigham-young",
    "TCU": "texas-christian",
    "UCF": "central-florida",
}

parser = argparse.ArgumentParser()
parser.add_argument("--refresh", action="store_true")
args = parser.parse_args()

nil_df = pd.read_csv(NIL_FILE)
big12_df = nil_df[nil_df["conference"] == "Big 12"].copy()

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0"})


def flatten(table):
    table = table.copy()

    if isinstance(table.columns, pd.MultiIndex):
        table.columns = table.columns.get_level_values(-1)

    table.columns = table.columns.astype(str).str.strip()
    return table


def clean(table):
    table = flatten(table)

    return table[
        table["Player"].notna()
        & ~table["Player"].astype(str).str.strip().isin(
            ["Player", "Team Totals", "Opponent Totals"]
        )
    ].copy()


def find_tables(html):
    soup = BeautifulSoup(html, "html.parser")

    roster = None
    per_game = None

    for element in soup.find_all("table"):
        table_id = element.get("id", "").lower()
        caption = element.find("caption")
        caption_text = (
            caption.get_text(" ", strip=True).lower()
            if caption else ""
        )

        try:
            table = flatten(
                pd.read_html(io.StringIO(str(element)))[0]
            )
        except (ValueError, ImportError):
            continue

        columns = set(table.columns)

        if (
            roster is None
            and {"Player", "Height", "Weight"}.issubset(columns)
        ):
            roster = clean(table)

        if not {
            "Player", "G", "GS", "MP", "PTS", "TRB", "AST"
        }.issubset(columns):
            continue

        is_per_game = (
            "per_game" in table_id
            or "per-game" in table_id
            or "per game" in caption_text
        )

        if is_per_game:
            per_game = clean(table)
            break

    # Fallback to the first matching player-statistics table.
    if per_game is None:
        tables = pd.read_html(io.StringIO(html))

        for table in tables:
            table = flatten(table)

            if {
                "Player", "G", "GS", "MP",
                "PTS", "TRB", "AST"
            }.issubset(table.columns):
                per_game = clean(table)
                break

    return roster, per_game


for _, row in big12_df.iterrows():
    team = row["team"]
    stem = team.lower().replace(" ", "_")
    slug = TEAM_MAPPING.get(
        team, team.lower().replace(" ", "-")
    )

    roster_file = ROSTER_DIR / f"{stem}.csv"
    per_game_file = PER_GAME_DIR / f"{stem}.csv"
    logo_file = LOGO_DIR / f"{stem}_logo.png"

    url = (
        "https://www.sports-reference.com/cbb/"
        f"schools/{slug}/men/{SEASON}.html"
    )

    print(f"\nProcessing {team}")

    if (
        args.refresh
        or not roster_file.exists()
        or not per_game_file.exists()
    ):
        try:
            response = session.get(url, timeout=30)

            if response.status_code in (403, 429):
                print(f"Access restricted: HTTP {response.status_code}")
                break

            response.raise_for_status()
            roster, per_game = find_tables(response.text)

            if roster is not None:
                roster.to_csv(roster_file, index=False)
                print(f"Roster saved: {len(roster)} players")
            else:
                print("Roster table not found")

            if per_game is not None:
                per_game.to_csv(per_game_file, index=False)
                print(f"Per Game saved: {len(per_game)} players")
            else:
                print("Per Game table not found")

        except Exception as exc:
            print(f"Download error: {exc}")

        time.sleep(5)

    if args.refresh or not logo_file.exists():
        logo_url = (
            "https://cdn.ssref.net/req/202611040/"
            f"tlogo/cbb/{slug}-2027.png"
        )

        try:
            response = session.get(logo_url, timeout=20)

            if response.status_code in (403, 429):
                print("Logo access restricted")
                break

            response.raise_for_status()

            image = Image.open(io.BytesIO(response.content))
            image.convert("RGBA").save(logo_file)

            print("Logo saved")

        except Exception as exc:
            print(f"Logo unavailable: {exc}")

        time.sleep(1)

print("\nCollection finished")
