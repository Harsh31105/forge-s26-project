import boto3
import pdfplumber
import anthropic
import io
import json
import base64
import re
import sys
import urllib.request
from collections import defaultdict
from rapidfuzz import fuzz
 
s3 = boto3.client("s3")
claude = anthropic.Anthropic()  # picks up ANTHROPIC_API_KEY from env
BUCKET = "forge-s26-trace-evaluations"
courses = defaultdict(dict)

def extract_tables(pdf_bytes):
    results = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            text = page.extract_text()
            for table in tables:
                if table:
                    results.append({
                        "page": page_num + 1,
                        "data": table,
                        "text": text
                    })
    return results


def extract_charts_with_claude(pdf_bytes):
    import pypdf

    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    writer = pypdf.PdfWriter()
    for page in reader.pages[-2:]:  # last two pages only
        writer.add_page(page)

    last_pages_bytes = io.BytesIO()
    writer.write(last_pages_bytes)
    last_pages_bytes = last_pages_bytes.getvalue()
    response = claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=250,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": base64.standard_b64encode(last_pages_bytes).decode("utf-8")
                    }
                },
                {
                    "type": "text",
                    "text": """Find pie charts about hours devoting the course and about attendance patterns in this PDF and extract their data.
                    Return only valid JSON, no explanation, in this format:
                    {
                        "charts": [
                            {
                                "title": "chart title",
                                "data": {"label": value}
                            }
                        ]
                    }"""
                }
            ]
        }]
    )
    try:
        raw = response.content[0].text.strip().replace("```json", "").replace("```", "")
        return json.loads(raw)
    except Exception:
        return _extract_charts_from_text(pdf_bytes)


def _extract_charts_from_text(pdf_bytes):
    """Fallback: parse attendance and hours-devoted charts directly from PDF text."""
    ATTENDANCE_LABELS = ["80-100%", "60-80%", "40-60%", "20-40%", "0-20%"]
    HOURS_LABELS      = ["More than 10", "8-10", "5-7", "3-4", "0-2"]

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        last_page = pdf.pages[-1]
        words     = last_page.extract_words()
        page_mid  = last_page.width / 2

    left_words  = [w for w in words if float(w["x0"]) < page_mid]
    right_words = [w for w in words if float(w["x0"]) >= page_mid]

    def words_to_text(word_list):
        return " ".join(w["text"] for w in sorted(word_list, key=lambda w: (w["top"], w["x0"])))

    def parse_chart(text, labels):
        tokens = text.split()
        # find positions of all known labels and all percentages
        label_positions = {}  # label -> token index where it starts
        for i in range(len(tokens)):
            for label in labels:
                lt = label.split()
                if tokens[i:i + len(lt)] == lt and label not in label_positions:
                    label_positions[label] = i

        pct_positions = {}  # token index -> float value
        for i, tok in enumerate(tokens):
            m = re.match(r"^(\d+\.?\d*)%$", tok)
            if m:
                pct_positions[i] = float(m.group(1))

        # pair each label with the next unused percentage after it
        used = set()
        result = {}
        for label in sorted(label_positions, key=lambda l: label_positions[l]):
            start = label_positions[label] + len(label.split())
            for idx in sorted(pct_positions):
                if idx >= start and idx not in used:
                    result[label] = pct_positions[idx]
                    used.add(idx)
                    break
        return result

    attendance = parse_chart(words_to_text(left_words),  ATTENDANCE_LABELS)
    hours      = parse_chart(words_to_text(right_words), HOURS_LABELS)
    return {"charts": [
        {"title": "how often attended", "data": attendance},
        {"title": "hours devoted",      "data": hours},
    ]}


def parse_course_info(text):
    """Extract course metadata from the first page text."""
    info = {}

    # Course name and semester: "Technology and Human Values (Fall 2024)"
    m = re.search(r"^(.+?)\s*\((Fall|Spring|Summer)\s*(\d{4})\)", text, re.MULTILINE)
    if m:
        info["name"] = m.group(1).strip()
        semester_raw = m.group(2).lower()
        info["semester"] = {"fall": "fall", "spring": "spring", "summer": "summer_1"}[semester_raw]

        info["year"] = int(m.group(3))

    # Instructor: "Instructor: Stubbs, Alec"
    m = re.search(r"Instructor:\s*([A-Za-z\-']+(?:\s[A-Za-z\-']+)*),\s*([A-Za-z\-']+)", text)
    if m:
        info["instructor_last"] = m.group(1).strip()
        info["instructor_first"] = m.group(2).strip()

    # Course ID (used as course_code)
    m = re.search(r"Course ID:\s*(\d+)", text)
    if m:
        info["course_code"] = int(m.group(1))

    # Lecture type: infer "online" if the PDF has online experience questions
    if "Online" in text or "online" in text:
        info["lecture_type"] = "online"

    return info


def _normalize_cell(text):
    """Normalize PDF cell text: fix ligature null bytes, collapse whitespace, strip digits."""
    import re
    text = text.replace("\x00", "ff")   # ff/fi/fl ligatures encoded as null bytes
    text = text.replace("\n", " ")
    text = re.sub(r"\d+", "", text)     # remove embedded response counts
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def parse_instructor_ratings(tables):
    """
    Find the row matching "What is your overall rating of this instructor's teaching
    effectiveness?" and extract the value under the "Course Mean" column.
    PDFs encode ligatures as null bytes and sometimes embed response counts in the cell.
    """
    # keywords that uniquely identify the target row after normalization
    TARGET_KEYWORDS = ("overall rating", "teaching", "effectiveness")

    for entry in tables:
        rows = entry["data"]

        # find which column index is "Course Mean" by scanning header rows
        course_mean_col = None
        for row in rows:
            for i, cell in enumerate(row):
                if cell:
                    normalized = _normalize_cell(str(cell))
                    if "course" in normalized and "mean" in normalized:
                        course_mean_col = i
                        break
            if course_mean_col is not None:
                break

        if course_mean_col is None:
            continue

        for row in rows:
            if not row or not row[0]:
                continue
            cell = _normalize_cell(str(row[0]))
            if all(kw in cell for kw in TARGET_KEYWORDS):
                try:
                    return float(row[course_mean_col])
                except (TypeError, ValueError, IndexError):
                    pass

    return None


def build_schemas_from_bytes(pdf_bytes, source_key, department, threshold=80):
    """Extract professor/course/trace schemas from raw PDF bytes."""
    tables = extract_tables(pdf_bytes)
    charts_data = _extract_charts_from_text(pdf_bytes)

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        first_page_text = pdf.pages[0].extract_text() or ""

    course_info = parse_course_info(first_page_text)
    professor_ratings = parse_instructor_ratings(tables)

    hours_devoted = {}
    how_often_percentage = {}
    for chart in charts_data.get("charts", []):
        title = chart.get("title", "").lower()
        if "hours" in title:
            hours_devoted = chart["data"]
        elif "attend" in title or "often" in title:
            how_often_percentage = chart["data"]

    # Professor schema (ProfessorPostInputSchema)
    course_name = course_info.get("name", "")
    dept_courses = courses.get(department, {}) if department else {}
  
    course_entry = None
    best_score = 0
    for name, entry in dept_courses.items():
        sim_score = fuzz.ratio(course_name, name)
        if sim_score >= best_score and sim_score >= threshold:
            best_score = sim_score
            course_entry = entry

    if not course_entry:
        print(f"  ⚠ no catalog match for {repr(course_name)} in {department} (threshold={threshold})")
        return None
    print(f"  catalog match ({best_score}%): {repr(course_name)} → {course_entry}")
    course_code = course_entry["number"]
    course_hours = course_entry["credits"]


    professor_schema = {
        "firstName": course_info.get("instructor_first", ""),
        "lastName": course_info.get("instructor_last", ""),
        "tags": []
    }

    # Course schema (CoursePostInputSchema)
    course_schema = {
        "name": course_info.get("name", ""),
        "course_code": course_code,
        "num_credits": course_hours,
        "lecture_type": course_info.get("lecture_type"),
    }

    # Trace schema (TracePostInputSchema)
    trace_schema = {
        "courseName": course_info.get("name", ""),
        "courseCode" : course_code,
        "semester": course_info.get("semester"),
        "lectureYear" : course_info.get("year"),
        "lectureType": course_info.get("lecture_type"),
        "hoursDevoted": hours_devoted,
        "proffesorEfficency": professor_ratings,  # float or None
        "howOftenPercentage": how_often_percentage,
    }

    return {
        "source": source_key,
        "professor": professor_schema,
        "course": course_schema,
        "trace": trace_schema,
    }


def build_schemas(pdf_path, department="CS"):
    """Entry point for local single-file use."""
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    return build_schemas_from_bytes(pdf_bytes, pdf_path, department)


def process_bucket(folder=None):
    """Process all PDFs in S3 bucket and save extracted schemas as JSON."""
    paginator = s3.get_paginator("list_objects_v2")
    stats = {"success": 0, "failed": 0}

    prefix = "trace-evaluations/"
    if folder: prefix += folder 
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if not key.endswith(".pdf"):
                continue

            # key shape: trace-evaluations/<DEPARTMENT>/...
            parts = key.split("/")
            department = parts[1] if len(parts) > 1 else None
            if department and department not in courses:
                scrape_course_information(department)

            out_key = f"extracted/{key.replace('.pdf', '.json')}"
            try:
                s3.head_object(Bucket=BUCKET, Key=out_key)
                print(f"  ⏭ already scraped, skipping {key}")
                stats["skipped"] = stats.get("skipped", 0) + 1
                continue
            except s3.exceptions.ClientError:
                pass  # not found, proceed

            print(f"Processing {key}...")
            pdf_bytes = s3.get_object(Bucket=BUCKET, Key=key)["Body"].read()

            try:
                result = build_schemas_from_bytes(pdf_bytes, key, department)

                s3.put_object(
                    Bucket=BUCKET,
                    Key=out_key,
                    Body=json.dumps(result, indent=2),
                    ContentType="application/json",
                )

                stats["success"] += 1
                with open("scores.txt", "a") as f:
                    f.write(f"key:{key}, departmet:{department}, result: {json.dumps(result, indent=2)}")
                print(f"  ✓ saved to s3://{BUCKET}/{out_key}")

            except Exception as e:
                stats["failed"] += 1
                print(f"  ✗ failed: {e}")
                with open("failed.txt", "a") as f:
                    f.write(f"{key}\n")

    print(f"\nDone: {stats}")

def scrape_course_information(department):
    url = f"https://catalog.northeastern.edu/course-descriptions/{department.lower()}/"
    
    with urllib.request.urlopen(url) as r:
        html = r.read().decode("utf-8")
    
    pattern = re.compile(r'([A-Z]+)\s+(\d+)\.\s+(.+?)\.\s+\((\d+)\s+Hours?\)', re.IGNORECASE)

    for _, number, name, credits in pattern.findall(html):
        if not name.strip() in courses[department]:
            courses[department][name.strip()] = {
                "number": number,
                "credits": int(credits)
            }


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--s3":
        process_bucket() # To scrape specific bucket, add path fro root trace-evaluations/
    else:
        scrape_course_information("CS")
        output = build_schemas("data/example2.pdf")
        print(json.dumps(output, indent=2))

        out_path = "data/schemas.json"
        with open(out_path, "w") as f:
            json.dump(output, f, indent=2)
        print(f"\nSchemas written to {out_path}")




# aws s3 cp s3://forge-s26-trace-evaluations/extracted/trace-evaluations/CS/undefined/fall_2023/bagley-keith-section-05-course-16875-sp-87625-4707-175-66154e0727.json - --profile forge-bucket


# aws s3 cp s3://forge-s26-trace-evaluations/extracted/trace-evaluations/CS/undefined/fall_2023/bayat-akram-section-33-course-21050-sp-89043-7028-175-a32abc1d7b.json - --profile forge-bucket


# Processing trace-evaluations/CS/undefined/fall_2023/arunagiri-sara-section-01-course-11549-sp-85576-3424-175-f09c72ecf8.pdf