from __future__ import annotations

from src.features import build_course_feature_record, semester_strength
from src.models import (
    Course,
    CourseFeatureRecord,
    CourseReview,
    Department,
    Favorite,
    RecommendationResult,
    Trace,
    UserProfileRecord,
)
from src.user_profile import build_user_profile


def compute_tag_match_score(
    user_tag_preferences: dict[str, int],
    course_tag_profile: dict[str, float],
) -> float:
    """
    Compute a score based on overlap between user-preferred tags
    and the course's normalized tag profile.
    """
    score = 0.0

    for tag, weight in user_tag_preferences.items():
        if tag in course_tag_profile:
            score += weight * course_tag_profile[tag]

    return score


def compute_department_bonus(course: Course, preferred_department_ids: list[int]) -> float:
    """
    Give a bonus if the course belongs to a department the user tends to favorite.
    """
    if course["department_id"] in preferred_department_ids:
        return 1.0
    return 0.0


def compute_lecture_type_bonus(course: Course, preferred_lecture_types: list[str]) -> float:
    """
    Give a bonus if the course uses a lecture type the user tends to favorite.
    """
    if course["lecture_type"] in preferred_lecture_types:
        return 0.5
    return 0.0


def compute_score(
    course: Course,
    user_profile: UserProfileRecord,
    departments: list[Department],
    reviews: list[CourseReview],
    trace_rows: list[Trace],
    preferred_semester: str,
) -> float:
    """
    Compute the overall recommendation score for one course.
    """
    feature_record: CourseFeatureRecord = build_course_feature_record(
        course,
        departments,
        reviews,
        trace_rows,
    )

    avg_rating = feature_record["avg_rating"]
    tag_profile = feature_record["tag_profile"]
    avg_hours_devoted = feature_record["avg_hours_devoted"]
    avg_prof_efficiency = feature_record["avg_professor_efficiency"]

    tag_score = compute_tag_match_score(
        user_profile["tag_preferences"],
        tag_profile,
    )

    department_bonus = compute_department_bonus(
        course,
        user_profile["preferred_department_ids"],
    )

    lecture_type_bonus = compute_lecture_type_bonus(
        course,
        user_profile["preferred_lecture_types"],
    )

    semester_bonus = semester_strength(course["id"], preferred_semester, trace_rows)
    workload_penalty = 0.1 * avg_hours_devoted

    return (
        1.5 * avg_rating
        + 1.2 * tag_score
        + 0.8 * avg_prof_efficiency
        + department_bonus
        + lecture_type_bonus
        + semester_bonus
        - workload_penalty
    )


# Layer 6: diversification / humanization
def diversify_ranked_courses(
    ranked_courses: list[RecommendationResult],
) -> list[RecommendationResult]:
    """
    Re-rank recommendations to avoid showing too many top courses
    from the same department first.
    """
    diversified: list[RecommendationResult] = []
    used_departments: set[int] = set()

    for item in ranked_courses:
        course = item["course"]
        department_id = course["department_id"]

        if department_id not in used_departments:
            diversified.append(item)
            used_departments.add(department_id)

    for item in ranked_courses:
        if item not in diversified:
            diversified.append(item)

    return diversified


def recommend_courses(
    student_id: str,
    preferred_semester: str,
    courses: list[Course],
    departments: list[Department],
    reviews: list[CourseReview],
    trace_rows: list[Trace],
    favorites: list[Favorite],
    top_k: int = 5,
) -> list[RecommendationResult]:
    """
    Generate the top-k recommended courses for a student.
    """
    profile: UserProfileRecord = build_user_profile(student_id, favorites, reviews, courses)

    ranked: list[RecommendationResult] = []

    favorite_ids = set(profile["favorite_course_ids"])

    for course in courses:
        if course["id"] in favorite_ids:
            continue

        score = compute_score(
            course,
            profile,
            departments,
            reviews,
            trace_rows,
            preferred_semester,
        )

        ranked.append(
            {
                "course": course,
                "score": score,
            }
        )

    ranked.sort(key=lambda item: item["score"], reverse=True)
    diversified = diversify_ranked_courses(ranked)

    return diversified[:top_k]