from pydantic import BaseModel

from backend.recommendations.api.schemas.schema import Course, Department, CourseReview, Trace, \
    Favorite


class CourseFeatureRecord(BaseModel):
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

class UserProfileRecord(BaseModel):
    student_id: str
    favorite_course_ids: list[str]
    preferred_department_ids: list[int]
    preferred_lecture_types: list[str]
    tag_preferences: dict[str, int]

class RecommendationResult(BaseModel):
    course: Course
    score: float

class TrainingExample(BaseModel):
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

class MLPredictionResult(BaseModel):
    course: Course
    probability: float

class RecommendRequest(BaseModel):
    student_id: str
    preferred_semester: str
    courses: list[Course]
    departments: list[Department]
    reviews: list[CourseReview]
    trace_rows: list[Trace]
    favorites: list[Favorite]
    top_k: int = 5

class RecommendResponse(BaseModel):
    high: list[RecommendationResult]
    medium: list[RecommendationResult]
    low: list[RecommendationResult]

class MLRecommendResponse(BaseModel):
    high: list[MLPredictionResult]
    medium: list[MLPredictionResult]
    low: list[MLPredictionResult]