from __future__ import annotations

import json
from typing import Any, cast

from src.models import Course, CourseReview, Department, Favorite, Student, Trace


def load_json_file(file_path: str) -> Any:
    """
    Load raw JSON data from a file.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def load_courses(file_path: str) -> list[Course]:
    """
    Load courses from JSON.
    """
    return cast(list[Course], load_json_file(file_path))


def load_departments(file_path: str) -> list[Department]:
    """
    Load departments from JSON.
    """
    return cast(list[Department], load_json_file(file_path))


def load_reviews(file_path: str) -> list[CourseReview]:
    """
    Load course reviews from JSON.
    """
    return cast(list[CourseReview], load_json_file(file_path))


def load_trace(file_path: str) -> list[Trace]:
    """
    Load trace rows from JSON.
    """
    return cast(list[Trace], load_json_file(file_path))


def load_favorites(file_path: str) -> list[Favorite]:
    """
    Load favorites from JSON.
    """
    return cast(list[Favorite], load_json_file(file_path))


def load_students(file_path: str) -> list[Student]:
    """
    Load students from JSON.
    """
    return cast(list[Student], load_json_file(file_path))