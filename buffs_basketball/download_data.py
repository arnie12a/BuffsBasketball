
# import pandas as pd
# from pathlib import Path
# from io import StringIO
# import requests

# BASE_URL = "https://www.sports-reference.com/cbb/schools/colorado"

# SEASON = 2027
# TEAMS = ["men", "women"]

# DATA_DIR = Path("data/raw")

# # Table names in the order returned by read_html()
# TABLE_NAMES = [
#     "roster",
#     "per_game_team_opponent",
#     "total_team_opponent",
#     "per_game",
#     "totals",
#     "per_40_minutes",
#     "per_100_possessions",
#     "advanced"
# ]


# def download_team_data(team):

#     url = f"{BASE_URL}/{team}/{SEASON}.html"

#     print(f"\nDownloading {team} basketball data...")
#     print(url)

#     response = requests.get(
#         url,
#         headers={
#             "User-Agent": "BuffBasketballResearch/1.0"
#         },
#         timeout=20
#     )

#     response.raise_for_status()

#     # Read all HTML tables
#     tables = pd.read_html(StringIO(response.text))

#     print(f"Found {len(tables)} tables")

#     team_dir = DATA_DIR / team
#     team_dir.mkdir(parents=True, exist_ok=True)

#     # Check that table count matches expected count
#     if len(tables) != len(TABLE_NAMES):
#         raise ValueError(
#             f"Expected {len(TABLE_NAMES)} tables, "
#             f"but found {len(tables)} for {team}. "
#             "Check table order before saving."
#         )

#     for name, df in zip(TABLE_NAMES, tables):

#         # Flatten multi-level headers
#         if isinstance(df.columns, pd.MultiIndex):
#             df.columns = [
#                 "_".join(
#                     str(part)
#                     for part in col
#                     if not str(part).startswith("Unnamed")
#                 )
#                 for col in df.columns
#             ]

#         df.columns = df.columns.astype(str).str.strip()

#         # Remove repeated header rows
#         if "Player" in df.columns:
#             df = df[df["Player"] != "Player"]

#         # Save CSV with meaningful filename
#         output_path = team_dir / f"{name}.csv"

#         df.to_csv(output_path, index=False)

#         print(
#             f"Saved {output_path} "
#             f"({df.shape[0]} rows, {df.shape[1]} columns)"
#         )

#     return dict(zip(TABLE_NAMES, tables))


# if __name__ == "__main__":
#     for team in TEAMS:
#         download_team_data(team)

import pandas as pd
from pathlib import Path
from io import StringIO
import requests
from bs4 import BeautifulSoup, Comment

# -----------------------------------
# Configuration
# -----------------------------------

BASE_URL = "https://www.sports-reference.com/cbb/schools/colorado"

SEASON = 2027
TEAMS = ["men", "women"]

# Save relative to this script's directory
DATA_DIR = Path(__file__).resolve().parent / "data" / "raw"

TABLE_NAMES = [
    "roster",
    "per_game_team_opponent",
    "total_team_opponent",
    "per_game",
    "totals",
    "per_40_minutes",
    "per_100_possessions",
    "advanced"
]


# -----------------------------------
# Extract all HTML tables
# -----------------------------------

def extract_tables(html):
    soup = BeautifulSoup(html, "html.parser")

    # Regular HTML tables
    html_tables = list(soup.find_all("table"))

    # Tables inside HTML comments
    for comment in soup.find_all(
        string=lambda text: isinstance(text, Comment)
    ):
        if "<table" in str(comment):
            comment_soup = BeautifulSoup(
                str(comment),
                "html.parser"
            )

            html_tables.extend(
                comment_soup.find_all("table")
            )

    print(f"Found {len(html_tables)} HTML tables")

    tables = []

    for i, table in enumerate(html_tables):
        try:
            df = pd.read_html(
                StringIO(str(table))
            )[0]

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

            # Remove repeated header rows
            if "Player" in df.columns:
                df = df[
                    df["Player"].astype(str) != "Player"
                ]

            df = df.reset_index(drop=True)

            print(f"\nTable {i}")
            print("HTML ID:", table.get("id"))
            print("Shape:", df.shape)
            print("Columns:", df.columns.tolist())

            tables.append(df)

        except (ValueError, ImportError) as e:
            print(f"Could not parse table {i}: {e}")

    return tables


# -----------------------------------
# Download team data
# -----------------------------------

def download_team_data(team):

    url = f"{BASE_URL}/{team}/{SEASON}.html"

    print("\n" + "=" * 60)
    print(f"Downloading {team.upper()} basketball data")
    print(url)
    print("=" * 60)

    response = requests.get(
        url,
        headers={
            "User-Agent": "BuffBasketballResearch/1.0"
        },
        timeout=30
    )

    response.raise_for_status()

    tables = extract_tables(response.text)

    print(f"\nTotal parsed tables: {len(tables)}")

    team_dir = DATA_DIR / team
    team_dir.mkdir(parents=True, exist_ok=True)

    # Do not assign incorrect names if tables are missing
    if len(tables) != len(TABLE_NAMES):
        print(
            f"\nWARNING: Expected {len(TABLE_NAMES)} "
            f"tables but found {len(tables)}."
        )
        print("Saving with temporary table names.")
        print("Inspect the printed table IDs and columns.")

        for i, df in enumerate(tables):
            output = team_dir / f"table_{i}.csv"
            df.to_csv(output, index=False)
            print(f"Saved: {output}")

        return tables

    # Save with descriptive filenames
    for name, df in zip(TABLE_NAMES, tables):

        output = team_dir / f"{name}.csv"

        df.to_csv(output, index=False)

        print(
            f"Saved {name}.csv "
            f"({df.shape[0]} rows, "
            f"{df.shape[1]} columns)"
        )

    print(f"\nSuccessfully saved {team} data!")

    return dict(zip(TABLE_NAMES, tables))


# -----------------------------------
# Main
# -----------------------------------

if __name__ == "__main__":

    for team in TEAMS:
        try:
            download_team_data(team)

        except requests.RequestException as e:
            print(f"Download failed for {team}: {e}")

        except Exception as e:
            print(f"Error processing {team}: {e}")
