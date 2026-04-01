import requests
from bs4 import BeautifulSoup
import re
import sqlite3
from typing import Optional

# Dummy tables setup

conn = sqlite3.connect("courses.db")
cur = conn.cursor()

cur.executescript("""
    CREATE TABLE IF NOT EXISTS courses (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        dept        TEXT    NOT NULL,
        course_code INTEGER NOT NULL,
        name        TEXT    NOT NULL,
        description TEXT,
        credits     INTEGER DEFAULT 4,
        prereqs     TEXT,
        coreqs      TEXT,
        nupaths     TEXT
    );

    CREATE TABLE IF NOT EXISTS course_nupaths (
        course_id   INTEGER REFERENCES courses(id),
        nupath      TEXT NOT NULL,
        PRIMARY KEY (course_id, nupath)
    );
""")

# Helpers

def parse_credits(raw: str) -> int:
    """Extract credit hours from title string, e.g. '(4 Hours)' → 4."""
    m = re.search(r'\((\d+)(?:-\d+)?\s+Hours?\)', raw, re.IGNORECASE)
    return int(m.group(1)) if m else 4


def parse_extra(course_block) -> dict:  # type: ignore[type-arg]
    """
    Parse courseblockextra / courseblockattr paragraphs for:
      - Prerequisite(s)
      - Corequisite(s)
      - Attribute(s) → NUpath tags
    """
    result: dict = {"prereqs": None, "coreqs": None, "nupaths": []}

    extra_blocks = course_block.find_all("p", class_=re.compile(r"courseblock(extra|attr)"))

    for block in extra_blocks:
        block_text = block.get_text(" ", strip=True)

        if re.match(r"Prerequisite", block_text, re.IGNORECASE):
            result["prereqs"] = re.sub(
                r"^Prerequisite\(s\):\s*", "", block_text, flags=re.IGNORECASE
            ).strip()

        elif re.match(r"Corequisite", block_text, re.IGNORECASE):
            result["coreqs"] = re.sub(
                r"^Corequisite\(s\):\s*", "", block_text, flags=re.IGNORECASE
            ).strip()

        elif re.match(r"Attribute", block_text, re.IGNORECASE):
            attrs_raw = re.sub(r"^Attribute\(s\):\s*", "", block_text, flags=re.IGNORECASE)
            nupaths: list[str] = [
                a.strip()
                for a in re.split(r",\s*(?=NUpath|\b[A-Z])", attrs_raw)
                if a.strip()
            ]
            result["nupaths"] = nupaths

    return result


def insert_course(
    cursor: sqlite3.Cursor,
    dept: str,
    course_code: int,
    name: str,
    description: Optional[str],
    credits: int,
    prereqs: Optional[str],
    coreqs: Optional[str],
    nupaths_str: Optional[str],
) -> int:
    """Insert a course row and return its rowid."""
    cursor.execute(
        """INSERT INTO courses
           (dept, course_code, name, description, credits, prereqs, coreqs, nupaths)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (dept, course_code, name, description, credits, prereqs, coreqs, nupaths_str),
    )
    return cursor.lastrowid  # type: ignore[return-value]


def insert_nupath(cursor: sqlite3.Cursor, course_id: int, nupath: str) -> None:
    """Insert a course↔nupath mapping (ignore duplicates)."""
    cursor.execute(
        "INSERT OR IGNORE INTO course_nupaths (course_id, nupath) VALUES (?, ?)",
        (course_id, nupath),
    )


# Scraping

base_url = "https://catalog.northeastern.edu"
index_url = base_url + "/course-descriptions/"

index_page = requests.get(index_url, timeout=15)
index_soup = BeautifulSoup(index_page.text, "html.parser")
links = [a["href"] for a in index_soup.select("#atozindex a") if a.get("href")]

for link in links:
    dept_page = requests.get(base_url + link, timeout=15)
    soup = BeautifulSoup(dept_page.text, "html.parser")

    for course in soup.find_all("div", class_="courseblock"):

        title_tag = course.find("p", class_="courseblocktitle")
        if not title_tag:
            continue
        title_text = title_tag.get_text(" ", strip=True)

        num_credits = parse_credits(title_text)

        title_clean = re.sub(
            r"\s*\(\d+(?:-\d+)?\s+Hours?\)", "", title_text, flags=re.IGNORECASE
        ).strip()

        if "." not in title_clean:
            continue
        header, name = title_clean.split(".", 1)
        header = header.strip()
        name = name.strip()

        parts = header.split()
        if len(parts) < 2 or not parts[1].isdigit():
            continue
        dept_name = parts[0]
        course_code = int(parts[1])

        desc_tag = course.find("p", class_="courseblockdesc")
        desc: Optional[str] = desc_tag.get_text(" ", strip=True) if desc_tag else None

        extra = parse_extra(course)
        nupaths_str: Optional[str] = (
            ", ".join(extra["nupaths"]) if extra["nupaths"] else None
        )

        course_id = insert_course(
            cur,
            dept_name,
            course_code,
            name,
            desc,
            num_credits,
            extra["prereqs"],
            extra["coreqs"],
            nupaths_str,
        )

        for np in extra["nupaths"]:
            insert_nupath(cur, course_id, np)

    conn.commit()
    print(f"Done: {link}")

conn.close()
print("\nAll done — results saved to courses.db")

import sqlite3

conn = sqlite3.connect("courses.db")
cur = conn.cursor()

# Row counts
cur.execute("SELECT COUNT(*) FROM courses")
print("Total courses:", cur.fetchone()[0])

cur.execute("SELECT COUNT(*) FROM course_nupaths")
print("Total nupath mappings:", cur.fetchone()[0])

# Sample rows from courses
print("\n--- Sample courses ---")
cur.execute("SELECT dept, course_code, name, credits, prereqs, nupaths FROM courses LIMIT 10")
for row in cur.fetchall():
    print(row)

# Check NUpath variety
print("\n--- Distinct NUPaths ---")
cur.execute("SELECT DISTINCT nupath FROM course_nupaths ORDER BY nupath")
for row in cur.fetchall():
    print(row[0])

# Spot-check a specific course
print("\n--- CS 2500 ---")
cur.execute("SELECT * FROM courses WHERE dept='CS' AND course_code=2500")
print(cur.fetchone())

conn.close()