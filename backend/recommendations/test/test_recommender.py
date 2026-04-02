from __future__ import annotations

import unittest
from pathlib import Path

from backend.recommendations.src.models import (
    Course,
    CourseReview,
    Department,
    Favorite,
    RecommendationResult,
    Trace,
)
from backend.recommendations.src.recommender import recommend_courses
from backend.recommendations.src.repository import (
    load_courses,
    load_departments,
    load_favorites,
    load_reviews,
    load_trace,
)
from backend.recommendations.src.user_profile import build_user_profile


class TestRecommenderPipeline(unittest.TestCase):
    """
    Basic tests for the recommendation pipeline.
    """

    courses: list[Course] = []
    departments: list[Department] = []
    reviews: list[CourseReview] = []
    trace_rows: list[Trace] = []
    favorites: list[Favorite] = []

    student_id = "aa91f8b2-1c3d-4e5f-9a6b-7c8d9e0f1a22"

    @classmethod
    def setUpClass(cls) -> None:
        """
        Load mock data once for all tests.
        """
        base_dir = Path(__file__).resolve().parent.parent
        data_dir = base_dir / "mock_data"

        cls.courses = load_courses(str(data_dir / "mock_courses.json"))
        cls.departments = load_departments(str(data_dir / "mock_departments.json"))
        cls.reviews = load_reviews(str(data_dir / "mock_reviews.json"))
        cls.trace_rows = load_trace(str(data_dir / "mock_trace.json"))
        cls.favorites = load_favorites(str(data_dir / "mock_favorites.json"))

    def test_build_user_profile_exists_and_returns_expected_keys(self) -> None:
        """
        Ensure build_user_profile runs and returns the expected structure.
        """
        profile = build_user_profile(
            self.student_id,
            self.favorites,
            self.reviews,
            self.courses,
        )

        self.assertEqual(profile["student_id"], self.student_id)
        self.assertIn("favorite_course_ids", profile)
        self.assertIn("preferred_department_ids", profile)
        self.assertIn("preferred_lecture_types", profile)
        self.assertIn("tag_preferences", profile)

    def test_build_user_profile_has_favorites(self) -> None:
        """
        Ensure the profile includes the student's favorited courses.
        """
        profile = build_user_profile(
            self.student_id,
            self.favorites,
            self.reviews,
            self.courses,
        )

        self.assertGreater(len(profile["favorite_course_ids"]), 0)

    def test_recommend_courses_returns_bucketed_results(self) -> None:
        """
        Ensure the recommender returns the expected HIGH / MEDIUM / LOW buckets.
        """
        results = recommend_courses(
            student_id=self.student_id,
            preferred_semester="Fall",
            courses=self.courses,
            departments=self.departments,
            reviews=self.reviews,
            trace_rows=self.trace_rows,
            favorites=self.favorites,
            top_k=5,
        )

        self.assertIn("high", results)
        self.assertIn("medium", results)
        self.assertIn("low", results)

    def test_recommend_courses_returns_at_least_one_result(self) -> None:
        """
        Ensure the recommender returns at least one recommendation across all buckets.
        """
        results = recommend_courses(
            student_id=self.student_id,
            preferred_semester="Fall",
            courses=self.courses,
            departments=self.departments,
            reviews=self.reviews,
            trace_rows=self.trace_rows,
            favorites=self.favorites,
            top_k=5,
        )

        total_results = (
            len(results["high"]) +
            len(results["medium"]) +
            len(results["low"])
        )

        self.assertGreater(total_results, 0)

    def test_recommend_courses_excludes_favorites(self) -> None:
        """
        Ensure already-favorited courses are not recommended.
        """
        results = recommend_courses(
            student_id=self.student_id,
            preferred_semester="Fall",
            courses=self.courses,
            departments=self.departments,
            reviews=self.reviews,
            trace_rows=self.trace_rows,
            favorites=self.favorites,
            top_k=5,
        )

        favorite_ids = {
            favorite["course_id"]
            for favorite in self.favorites
            if favorite["student_id"] == self.student_id
        }

        all_results: list[RecommendationResult] = (
            results["high"] + results["medium"] + results["low"]
        )

        for item in all_results:
            self.assertNotIn(item["course"]["id"], favorite_ids)

    def test_each_bucket_is_sorted_descending(self) -> None:
        """
        Ensure each bucket is sorted from highest score to lowest score.
        """
        results = recommend_courses(
            student_id=self.student_id,
            preferred_semester="Fall",
            courses=self.courses,
            departments=self.departments,
            reviews=self.reviews,
            trace_rows=self.trace_rows,
            favorites=self.favorites,
            top_k=5,
        )

        for bucket_name in ["high", "medium", "low"]:
            bucket = results[bucket_name]
            scores = [item["score"] for item in bucket]
            self.assertEqual(scores, sorted(scores, reverse=True))


if __name__ == "__main__":
    unittest.main()