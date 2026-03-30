from __future__ import annotations

from pathlib import Path

import joblib
from sklearn.linear_model import LogisticRegression

from backend.recommendation_algorithm.src.repository import (
    load_courses,
    load_departments,
    load_favorites,
    load_reviews,
    load_trace,
    load_students,
)
from backend.recommendation_algorithm.src.training_data import (
    build_training_examples,
    examples_to_xy,
)


def main() -> None:
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "mock_data"
    model_dir = base_dir / "artifacts"
    model_dir.mkdir(exist_ok=True)

    courses = load_courses(str(data_dir / "mock_courses.json"))
    departments = load_departments(str(data_dir / "mock_departments.json"))
    reviews = load_reviews(str(data_dir / "mock_reviews.json"))
    trace_rows = load_trace(str(data_dir / "mock_trace.json"))
    favorites = load_favorites(str(data_dir / "mock_favorites.json"))
    students = load_students(str(data_dir / "mock_users.json"))

    student_ids = [student["id"] for student in students]

    examples = build_training_examples(
        student_ids=student_ids,
        courses=courses,
        departments=departments,
        reviews=reviews,
        trace_rows=trace_rows,
        favorites=favorites,
        preferred_semester="Fall",
    )

    X, y, feature_names = examples_to_xy(examples)

    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)

    model_path = model_dir / "course_recommender.joblib"
    metadata_path = model_dir / "feature_names.joblib"

    joblib.dump(model, model_path)
    joblib.dump(feature_names, metadata_path)

    print(f"Saved model to: {model_path}")
    print(f"Saved feature names to: {metadata_path}")


if __name__ == "__main__":
    main()