from __future__ import annotations

from pathlib import Path

import joblib

from backend.recommendation_algorithm.src.models import (
    Course,
    CourseReview,
    Department,
    Favorite,
    MLPredictionResult,
    Trace,
)
from backend.recommendation_algorithm.src.training_data import (
    build_student_course_example,
    examples_to_xy,
)
from backend.recommendation_algorithm.src.user_profile import build_user_profile


def categorize_ml_courses(
    ranked_courses: list[MLPredictionResult],
) -> dict[str, list[MLPredictionResult]]:
    if not ranked_courses:
        return {"high": [], "medium": [], "low": []}

    scores = [item["probability"] for item in ranked_courses]

    max_score = max(scores)
    min_score = min(scores)

    # avoid divide-by-zero if all scores equal
    if max_score == min_score:
        return {
            "high": ranked_courses,
            "medium": [],
            "low": [],
        }

    def normalize(score: float) -> float:
        return (score - min_score) / (max_score - min_score)

    high = []
    medium = []
    low = []

    for item in ranked_courses:
        norm_score = normalize(item["probability"])

        if norm_score >= 0.66:
            high.append(item)
        elif norm_score >= 0.33:
            medium.append(item)
        else:
            low.append(item)

    return {
        "high": high,
        "medium": medium,
        "low": low,
    }


def recommend_courses_ml(
    student_id: str,
    preferred_semester: str,
    courses: list[Course],
    departments: list[Department],
    reviews: list[CourseReview],
    trace_rows: list[Trace],
    favorites: list[Favorite],
) -> dict[str, list[MLPredictionResult]]:
    """
    Load the trained model and rank courses for one student.
    """
    base_dir = Path(__file__).resolve().parent.parent
    model = joblib.load(base_dir / "artifacts" / "course_recommender.joblib")
    _feature_names = joblib.load(base_dir / "artifacts" / "feature_names.joblib")

    profile = build_user_profile(student_id, favorites, reviews, courses)
    favorite_ids = set(profile["favorite_course_ids"])

    examples = []
    candidate_courses: list[Course] = []

    for course in courses:
        if course["id"] in favorite_ids:
            continue

        example = build_student_course_example(
            student_id=student_id,
            course=course,
            user_profile=profile,
            departments=departments,
            reviews=reviews,
            trace_rows=trace_rows,
            preferred_semester=preferred_semester,
            label=0,
        )
        examples.append(example)
        candidate_courses.append(course)

    X, _, _ = examples_to_xy(examples)
    probs = model.predict_proba(X)[:, 1]

    ranked: list[MLPredictionResult] = []
    for i, course in enumerate(candidate_courses):
        ranked.append(
            {
                "course": course,
                "probability": float(probs[i]),
            }
        )

    ranked.sort(key=lambda item: item["probability"], reverse=True)
    return categorize_ml_courses(ranked)