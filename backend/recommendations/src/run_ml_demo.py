from __future__ import annotations

from pathlib import Path

from backend.recommendations.src.ml_recommender import recommend_courses_ml
from backend.recommendations.src.repository import (
    load_courses,
    load_departments,
    load_favorites,
    load_reviews,
    load_trace,
)


def main() -> None:
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "mock_data"

    courses = load_courses(str(data_dir / "mock_courses.json"))
    departments = load_departments(str(data_dir / "mock_departments.json"))
    reviews = load_reviews(str(data_dir / "mock_reviews.json"))
    trace_rows = load_trace(str(data_dir / "mock_trace.json"))
    favorites = load_favorites(str(data_dir / "mock_favorites.json"))

    results = recommend_courses_ml(
        student_id="aa91f8b2-1c3d-4e5f-9a6b-7c8d9e0f1a22",
        preferred_semester="Fall",
        courses=courses,
        departments=departments,
        reviews=reviews,
        trace_rows=trace_rows,
        favorites=favorites,
    )

    print("\n=== HIGH ===")
    for item in results["high"]:
        print(f"- {item['course']['name']} -> {item['probability']:.3f}")

    print("\n=== MEDIUM ===")
    for item in results["medium"]:
        print(f"- {item['course']['name']} -> {item['probability']:.3f}")

    print("\n=== LOW ===")
    for item in results["low"]:
        print(f"- {item['course']['name']} -> {item['probability']:.3f}")


if __name__ == "__main__":
    main()