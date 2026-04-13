import requests
from bs4 import BeautifulSoup
import re
import os
from typing import Optional
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT
)

cur = conn.cursor()

def parse_credits(raw: str) -> int:
    m = re.search(r'\((\d+)(?:-\d+)?\s+Hours?\)', raw, re.IGNORECASE)
    return int(m.group(1)) if m else 4

def parse_extra(course_block) -> dict:
    result = {"prereqs": None, "coreqs": None, "nupaths": []}

    extra_blocks = course_block.find_all(
        "p", class_=re.compile(r"courseblock(extra|attr)")
    )

    for block in extra_blocks:
        text = block.get_text(" ", strip=True)

        if re.match(r"Prerequisite", text, re.IGNORECASE):
            result["prereqs"] = re.sub(
                r"^Prerequisite\(s\):\s*", "", text, flags=re.IGNORECASE
            ).strip()

        elif re.match(r"Corequisite", text, re.IGNORECASE):
            result["coreqs"] = re.sub(
                r"^Corequisite\(s\):\s*", "", text, flags=re.IGNORECASE
            ).strip()

        elif re.match(r"Attribute", text, re.IGNORECASE):
            attrs_raw = re.sub(
                r"^Attribute\(s\):\s*", "", text, flags=re.IGNORECASE
            )
            nupaths = [
                a.strip()
                for a in re.split(r",\s*(?=NUpath|\b[A-Z])", attrs_raw)
                if a.strip()
            ]
            result["nupaths"] = nupaths

    return result


def clean(val):
    return val if val and val.strip() else None

def patch_course(cursor, dept, course_code, description, prereqs, coreqs, nupath):
    cursor.execute("""
        SELECT c.id
        FROM course c
        JOIN department d ON c.department_id = d.id
        WHERE d.name = %s AND c.course_code = %s
        LIMIT 1
    """, (dept, course_code))

    row = cursor.fetchone()

    if not row:
        print(f"SKIP: {dept} {course_code} not found")
        return None

    course_id = row[0]

    cursor.execute("""
        UPDATE course
        SET
            description = COALESCE(%s, description),
            prereqs = COALESCE(%s, prereqs),
            coreqs = COALESCE(%s, coreqs),
            nupath = COALESCE(%s, nupath),
            updated_at = NOW()
        WHERE id = %s
    """, (description, prereqs, coreqs, nupath, course_id))

    print(f"UPDATED: {dept} {course_code}")
    return course_id

# Commented out stuff for iteration. Only for 'CS' for testing purposes!
BASE_URL = "https://catalog.northeastern.edu"
# INDEX_URL = BASE_URL + "/course-descriptions/"
#
# print("Fetching index...")
# index_page = requests.get(INDEX_URL, timeout=15)
# index_soup = BeautifulSoup(index_page.text, "html.parser")
#
# links = [
#     a["href"]
#     for a in index_soup.select("#atozindex a")
#     if a.get("href")
# ]
links = ["/course-descriptions/cs/"]

print(f"Found {len(links)} departments\n")

for link in links:
    print(f"Processing {link}...")

    dept_page = requests.get(BASE_URL + link, timeout=15)
    soup = BeautifulSoup(dept_page.text, "html.parser")

    for course in soup.find_all("div", class_="courseblock"):

        title_tag = course.find("p", class_="courseblocktitle")
        if not title_tag:
            continue

        title_text = title_tag.get_text(" ", strip=True)

        title_clean = re.sub(
            r"\s*\(\d+(?:-\d+)?\s+Hours?\)",
            "",
            title_text,
            flags=re.IGNORECASE
        ).strip()

        if "." not in title_clean:
            continue

        header, name = title_clean.split(".", 1)
        parts = header.strip().split()

        if len(parts) < 2 or not parts[1].isdigit():
            continue

        dept_name = parts[0]
        course_code = int(parts[1])

        desc_tag = course.find("p", class_="cb_desc")
        desc = desc_tag.get_text(" ", strip=True) if desc_tag else None

        extra = parse_extra(course)
        nupath_str = ", ".join(extra["nupaths"]) if extra["nupaths"] else None

        patch_course(
            cur,
            dept_name,
            course_code,
            clean(desc),
            clean(extra["prereqs"]),
            clean(extra["coreqs"]),
            clean(nupath_str),
        )

conn.commit()
conn.close()

print("\nDONE — database updated successfully 🚀")