from __future__ import annotations

from backend.recommendation_algorithm.src.repository import (
    load_courses,
    load_departments,
    load_favorites,
    load_reviews,
    load_trace,
)
from backend.recommendation_algorithm.src.recommender import recommend_courses


def main() -> None:
    """
    Demo runner for the course recommendation pipeline.
    """
    courses = load_courses("src/data/mock_courses.json")
    departments = load_departments("src/data/mock_departments.json")
    reviews = load_reviews("src/data/mock_reviews.json")
    trace_rows = load_trace("src/data/mock_trace.json")
    favorites = load_favorites("src/data/mock_favorites.json")

    results = recommend_courses(
        student_id="aa91f8b2-1c3d-4e5f-9a6b-7c8d9e0f1a22",
        preferred_semester="Fall",
        courses=courses,
        departments=departments,
        reviews=reviews,
        trace_rows=trace_rows,
        favorites=favorites,
        top_k=5,
    )

    print("Recommended courses:")
    for item in results:
        course = item["course"]
        score = item["score"]
        print(f'- {course["name"]} -> {score:.2f}')


if __name__ == "__main__":
    main()