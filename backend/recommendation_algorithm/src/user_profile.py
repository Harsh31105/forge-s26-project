from __future__ import annotations

from collections import Counter

from backend.recommendation_algorithm.src.models import Course, CourseReview, Favorite, UserProfileRecord


def get_favorited_course_ids(student_id: str, favorites: list[Favorite]) -> list[str]:
    """
    Return the ids of all courses favorited by the given student.
    """
    return [
        favorite["course_id"]
        for favorite in favorites
        if favorite["student_id"] == student_id
    ]


def build_user_profile(
    student_id: str,
    favorites: list[Favorite],
    reviews: list[CourseReview],
    courses: list[Course],
) -> UserProfileRecord:
    """
    Build a user preference profile from favorited courses.

    Since reviews are not directly tied to students in the current schema,
    this function infers preferences from the student's favorited courses
    and the review tags attached to those courses.
    """
    favorite_course_ids = set(get_favorited_course_ids(student_id, favorites))

    favorite_courses = [
        course for course in courses if course["id"] in favorite_course_ids
    ]

    department_counter: Counter[int] = Counter(
        course["department_id"] for course in favorite_courses
    )
    lecture_type_counter: Counter[str] = Counter(
        course["lecture_type"] for course in favorite_courses
    )

    tag_counter: Counter[str] = Counter()

    for review in reviews:
        if review["course_id"] in favorite_course_ids:
            for tag in review["tags"]:
                tag_counter[tag] += 1

    return {
        "student_id": student_id,
        "favorite_course_ids": list(favorite_course_ids),
        "preferred_department_ids": [
            department_id for department_id, _ in department_counter.most_common()
        ],
        "preferred_lecture_types": [
            lecture_type for lecture_type, _ in lecture_type_counter.most_common()
        ],
        "tag_preferences": dict(tag_counter),
    }