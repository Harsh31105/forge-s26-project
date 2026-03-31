from pydantic import BaseModel

class Course(BaseModel):
    id: str
    name: str
    department_id: int
    course_code: int
    description: str
    num_credits: int
    lecture_type: str
    created_at: str
    updated_at: str

class Department(BaseModel):
    id: int
    name: str


class Trace(BaseModel):
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


class CourseReview(BaseModel):
    review_id: str
    course_id: str
    rating: int
    review_text: str
    tags: list[str]
    created_at: str
    updated_at: str


class Favorite(BaseModel):
    student_id: str
    course_id: str
    created_at: str
    updated_at: str


class Student(BaseModel):
    id: str
    first_name: str
