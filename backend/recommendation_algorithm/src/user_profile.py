from __future__ import annotations

from collections import Counter

from recommendation_algorithm.src.models import Course, CourseFeatureRecord, CourseReview, Department, Trace


def get_department_name(department_id: int, departments: list[Department]) -> str:
    """
    Return the name of the department with the given id.
    """
    for department in departments:
        if department["id"] == department_id:
            return str(department["name"])
    return "UNKNOWN"


def get_reviews_for_course(course_id: str, reviews: list[CourseReview]) -> list[CourseReview]:
    """
    Return all reviews associated with a course.
    """
    return [review for review in reviews if review["course_id"] == course_id]


def get_trace_for_course(course_id: str, trace_rows: list[Trace]) -> list[Trace]:
    """
    Return all trace rows associated with a course.
    """
    return [row for row in trace_rows if row["course_id"] == course_id]


def average_rating(course_id: str, reviews: list[CourseReview]) -> float:
    """
    Compute the average rating for a course.
    """
    course_reviews = get_reviews_for_course(course_id, reviews)

    if not course_reviews:
        return 0.0

    total_rating = sum(review["rating"] for review in course_reviews)
    return float(total_rating / len(course_reviews))


def aggregate_review_tags(course_id: str, reviews: list[CourseReview]) -> dict[str, float]:
    """
    Build a normalized tag-frequency profile for a course.
    """
    course_reviews = get_reviews_for_course(course_id, reviews)
    tag_counter: Counter[str] = Counter()

    for review in course_reviews:
        for tag in review["tags"]:
            tag_counter[tag] += 1

    total = sum(tag_counter.values())

    if total == 0:
        return {}

    return {tag: count / total for tag, count in tag_counter.items()}


def average_hours_devoted(course_id: str, trace_rows: list[Trace]) -> float:
    """
    Compute the average hours devoted for a course.
    """
    rows = get_trace_for_course(course_id, trace_rows)

    if not rows:
        return 0.0

    total_hours = sum(row["hours_devoted"] for row in rows)
    return float(total_hours / len(rows))


def average_professor_efficiency(course_id: str, trace_rows: list[Trace]) -> float:
    """
    Compute the average professor efficiency for a course.
    """
    rows = get_trace_for_course(course_id, trace_rows)

    if not rows:
        return 0.0

    total_efficiency = sum(row["professor_efficiency"] for row in rows)
    return float(total_efficiency / len(rows))


def semester_strength(course_id: str, preferred_semester: str, trace_rows: list[Trace]) -> float:
    """
    Return the fraction of trace rows for a course that match the preferred semester.
    """
    rows = get_trace_for_course(course_id, trace_rows)

    if not rows:
        return 0.0

    matching_rows = [
        row for row in rows if row["semester"].lower() == preferred_semester.lower()
    ]

    return float(len(matching_rows) / len(rows))


def build_course_feature_record(
    course: Course,
    departments: list[Department],
    reviews: list[CourseReview],
    trace_rows: list[Trace],
) -> CourseFeatureRecord:
    """
    Build a course-level feature record using course, review, and trace data.
    """
    return {
        "course_id": course["id"],
        "course_name": course["name"],
        "department_name": get_department_name(course["department_id"], departments),
        "course_code": course["course_code"],
        "description": course["description"],
        "num_credits": course["num_credits"],
        "lecture_type": course["lecture_type"],
        "avg_rating": average_rating(course["id"], reviews),
        "tag_profile": aggregate_review_tags(course["id"], reviews),
        "avg_hours_devoted": average_hours_devoted(course["id"], trace_rows),
        "avg_professor_efficiency": average_professor_efficiency(course["id"], trace_rows),
    }