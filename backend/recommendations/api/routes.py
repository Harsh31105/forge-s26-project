from fastapi import APIRouter, HTTPException

from backend.recommendations.api.schemas.rec_schemas import (RecommendResponse, RecommendRequest,
                                                             RecommendationResult,
                                                             MLRecommendResponse,
                                                             MLPredictionResult)
from backend.recommendations.src.ml_recommender import recommend_courses_ml
from backend.recommendations.src.recommender import recommend_courses

router = APIRouter(prefix="/recommend", tags=["Recommendations"])

@router.post("", response_model=RecommendResponse, summary="Rule-base recommendations")
def recommend(body: RecommendRequest) -> RecommendResponse:
    try:
        results = recommend_courses(
            student_id=body.student_id,
            preferred_semester=body.preferred_semester,
            courses=[c.model_dump() for c in body.courses],
            departments=[d.model_dump() for d in body.departments],
            reviews=[r.model_dump() for r in body.reviews],
            trace_rows=[t.model_dump() for t in body.trace_rows],
            favorites=[f.model_dump() for f in body.favorites],
            top_k=5,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return RecommendResponse(
        high=[RecommendationResult(course=item["course"],
                                   score=item["score"]) for item in results["high"]],
        medium=[RecommendationResult(course=item["course"],
                                     score=item["score"]) for item in results["medium"]],
        low=[RecommendationResult(course=item["course"],
                                  score=item["score"]) for item in results["low"]],
    )


@router.post(
    "/ml",
    response_model=MLRecommendResponse,
    summary="ML-based recommendations",
)
def recommend_ml(body: RecommendRequest) -> MLRecommendResponse:
    try:
        results = recommend_courses_ml(
            student_id=body.student_id,
            preferred_semester=body.preferred_semester,
            courses=[c.model_dump() for c in body.courses],
            departments=[d.model_dump() for d in body.departments],
            reviews=[r.model_dump() for r in body.reviews],
            trace_rows=[t.model_dump() for t in body.trace_rows],
            favorites=[f.model_dump() for f in body.favorites],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return MLRecommendResponse(
        high=[MLPredictionResult(course=item["course"],
                                 probability=item["probability"]) for item in results["high"]],
        medium=[MLPredictionResult(course=item["course"],
                                   probability=item["probability"]) for item in results["medium"]],
        low=[MLPredictionResult(course=item["course"],
                                probability=item["probability"]) for item in results["low"]],
    )
