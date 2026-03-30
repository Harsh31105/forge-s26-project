from __future__ import annotations

from backend.recommendation_algorithm.src.features import build_course_feature_record, semester_strength
from backend.recommendation_algorithm.src.models import (
    Course,
    CourseFeatureRecord,
    CourseReview,
    Department,
    Favorite,
    Trace,
    TrainingExample,
    UserProfileRecord,
)
from backend.recommendation_algorithm.src.user_profile import build_user_profile


def compute_tag_overlap(
    user_tag_preferences: dict[str, int],
    course_tag_profile: dict[str, float],
) -> float:
    """
    Compute normalized overlap between a user's preferred tags
    and a course's tag profile.
    """
    score = 0.0

    for tag, weight in user_tag_preferences.items():
        if tag in course_tag_profile:
            score += weight * course_tag_profile[tag]

    return score


def build_student_course_example(
    student_id: str,
    course: Course,
    user_profile: UserProfileRecord,
    departments: list[Department],
    reviews: list[CourseReview],
    trace_rows: list[Trace],
    preferred_semester: str,
    label: int,
) -> TrainingExample:
    """
    Build one labeled training row for a (student, course) pair.
    """
    feature_record: CourseFeatureRecord = build_course_feature_record(
        course,
        departments,
        reviews,
        trace_rows,
    )

    department_match = 1 if course["department_id"] in user_profile["preferred_department_ids"] else 0
    lecture_type_match = 1 if course["lecture_type"] in user_profile["preferred_lecture_types"] else 0
    semester_match = 1 if semester_strength(course["id"], preferred_semester, trace_rows) > 0 else 0
    tag_overlap = compute_tag_overlap(
        user_profile["tag_preferences"],
        feature_record["tag_profile"],
    )

    return {
        "student_id": student_id,
        "course_id": course["id"],
        "department_match": department_match,
        "lecture_type_match": lecture_type_match,
        "semester_match": semester_match,
        "tag_overlap": tag_overlap,
        "avg_rating": feature_record["avg_rating"],
        "avg_hours_devoted": feature_record["avg_hours_devoted"],
        "avg_professor_efficiency": feature_record["avg_professor_efficiency"],
        "course_code": course["course_code"],
        "num_credits": course["num_credits"],
        "label": label,
    }


def build_training_examples(
    student_ids: list[str],
    courses: list[Course],
    departments: list[Department],
    reviews: list[CourseReview],
    trace_rows: list[Trace],
    favorites: list[Favorite],
    preferred_semester: str = "Fall",
) -> list[TrainingExample]:
    """
    Build a training dataset from all provided students and courses.

    Positive label:
        course is favorited by student

    Negative label:
        course is not favorited by student
    """
    examples: list[TrainingExample] = []

    for student_id in student_ids:
        user_profile = build_user_profile(student_id, favorites, reviews, courses)
        favorite_course_ids = set(user_profile["favorite_course_ids"])

        for course in courses:
            label = 1 if course["id"] in favorite_course_ids else 0

            example = build_student_course_example(
                student_id=student_id,
                course=course,
                user_profile=user_profile,
                departments=departments,
                reviews=reviews,
                trace_rows=trace_rows,
                preferred_semester=preferred_semester,
                label=label,
            )
            examples.append(example)

    return examples


def examples_to_xy(
    examples: list[TrainingExample],
) -> tuple[list[list[float]], list[int], list[str]]:
    """
    Convert training examples into:
    - X feature matrix
    - y labels
    - feature name list
    """
    feature_names = [
        "department_match",
        "lecture_type_match",
        "semester_match",
        "tag_overlap",
        "avg_rating",
        "avg_hours_devoted",
        "avg_professor_efficiency",
        "course_code",
        "num_credits",
    ]

    X: list[list[float]] = []
    y: list[int] = []

    for example in examples:
        X.append(
            [
                float(example["department_match"]),
                float(example["lecture_type_match"]),
                float(example["semester_match"]),
                float(example["tag_overlap"]),
                float(example["avg_rating"]),
                float(example["avg_hours_devoted"]),
                float(example["avg_professor_efficiency"]),
                float(example["course_code"]),
                float(example["num_credits"]),
            ]
        )
        y.append(example["label"])

    return X, y, feature_names