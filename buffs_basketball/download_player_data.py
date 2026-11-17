
import pandas as pd
from pathlib import Path
import re
import time
import unicodedata

# -----------------------------------
# Configuration
# -----------------------------------

BASE_URL = "https://www.sports-reference.com/cbb/players"

DATA_DIR = Path(__file__).resolve().parent / "data" / "raw"

TEAMS = {
    "men": {
        "roster": DATA_DIR / "men" / "roster.csv",
        "output": DATA_DIR / "mens_player_data"
    },
    "women": {
        "roster": DATA_DIR / "women" / "roster.csv",
        "output": DATA_DIR / "womens_player_data"
    }
}


# -----------------------------------
# Convert player name to URL
# -----------------------------------

def player_slug(name):

    name = unicodedata.normalize("NFKD", str(name))
    name = name.encode("ascii", "ignore").decode("ascii")

    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9\s-]", "", name)
    name = re.sub(r"[\s-]+", "-", name)

    return f"{name}-1"


# -----------------------------------
# Download individual player data
# -----------------------------------

def download_player(name, output_dir):

    slug = player_slug(name)

    url = f"{BASE_URL}/{slug}/gamelog/"

    print(f"\nDownloading {name}")
    print(url)

    try:
        # Directly read all tables from the website
        tables = pd.read_html(url)

        print(f"Found {len(tables)} tables")

        if not tables:
            print(f"No tables found for {name}")
            return False

        # Save every table found
        filename = slug.removesuffix("-1").replace("-", "_")

        for i, df in enumerate(tables):

            # Flatten multi-level columns
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = [
                    "_".join(
                        str(part)
                        for part in col
                        if not str(part).startswith("Unnamed")
                    )
                    for col in df.columns
                ]

            df.columns = df.columns.astype(str).str.strip()

            # Save CSV
            if len(tables) == 1:
                output_path = (
                    output_dir / f"{filename}.csv"
                )
            else:
                output_path = (
                    output_dir / f"{filename}_table_{i}.csv"
                )

            df.to_csv(output_path, index=False)

            print(
                f"Saved {output_path.name} "
                f"({df.shape[0]} rows, "
                f"{df.shape[1]} columns)"
            )

        return True

    except Exception as e:
        print(f"Error downloading {name}: {e}")
        return False


# -----------------------------------
# Download all players
# -----------------------------------

def download_team_players(team):

    config = TEAMS[team]

    roster_path = config["roster"]
    output_dir = config["output"]

    if not roster_path.exists():
        print(f"Roster not found: {roster_path}")
        return

    output_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    roster = pd.read_csv(roster_path)

    if "Player" not in roster.columns:
        print("Player column not found")
        print(roster.columns.tolist())
        return

    players = (
        roster["Player"]
        .dropna()
        .astype(str)
        .str.strip()
        .drop_duplicates()
        .tolist()
    )

    print(f"\n{'=' * 50}")
    print(f"{team.upper()} BASKETBALL")
    print(f"Found {len(players)} players")
    print(f"{'=' * 50}")

    success = 0

    for i, player in enumerate(players):

        print(f"\nPlayer {i + 1}/{len(players)}")

        if download_player(player, output_dir):
            success += 1

        if i < len(players) - 1:
            time.sleep(5)

    print(f"\n{team.upper()} COMPLETE")
    print(f"Downloaded {success}/{len(players)} players")


# -----------------------------------
# Main
# -----------------------------------

if __name__ == "__main__":

    for team in ["men", "women"]:
        download_team_players(team)
