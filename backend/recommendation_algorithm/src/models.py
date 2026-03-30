from __future__ import annotations

from typing import TypedDict


class Course(TypedDict):
    id: str
    name: str
    department_id: int
    course_code: int
    description: str
    num_credits: int
    lecture_type: str
    created_at: str
    updated_at: str


class Department(TypedDict):
    id: int
    name: str


class Trace(TypedDict):
    id: int
    course_id: str
    professor_id: str
    course_name: str
    department_id: int
    course_code: int
    semester: str
    lecture_year: int
    lecture_type: str
    how_often_percentage: float
    hours_devoted: float
    professor_efficiency: float
    created_at: str
    updated_at: str


class CourseReview(TypedDict):
    review_id: str
    course_id: str
    rating: int
    review_text: str
    tags: list[str]
    created_at: str
    updated_at: str


class Favorite(TypedDict):
    student_id: str
    course_id: str
    created_at: str
    updated_at: str


class Student(TypedDict):
    id: str
    first_name: str


class CourseFeatureRecord(TypedDict):
    course_id: str
    course_name: str
    department_name: str
    course_code: int
    description: str
    num_credits: int
    lecture_type: str
    avg_rating: float
    tag_profile: dict[str, float]
    avg_hours_devoted: float
    avg_professor_efficiency: float


class UserProfileRecord(TypedDict):
    student_id: str
    favorite_course_ids: list[str]
    preferred_department_ids: list[int]
    preferred_lecture_types: list[str]
    tag_preferences: dict[str, int]


class RecommendationResult(TypedDict):
    course: Course
    score: float

class TrainingExample(TypedDict):
    student_id: str
    course_id: str
    department_match: int
    lecture_type_match: int
    semester_match: int
    tag_overlap: float
    avg_rating: float
    avg_hours_devoted: float
    avg_professor_efficiency: float
    course_code: int
    num_credits: int
    label: int


class MLPredictionResult(TypedDict):
    course: Course
    probability: float