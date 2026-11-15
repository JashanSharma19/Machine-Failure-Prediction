from pydantic import BaseModel, Field
from typing import Literal

class GenerateRequest(BaseModel):
    count: int = Field(200, ge=50, le=1000)
    groups: list[str] = Field(default_factory=lambda: ["A", "B", "C"], min_length=2, max_length=8)
    distribution: Literal["exponential", "weibull"] = "weibull"
    scale: float = Field(500, gt=0)
    shape: float = Field(1.7, gt=0)
    seed: int | None = None
    censoring: bool = False
    censor_hours: float = Field(400, gt=0)

class PredictRequest(BaseModel):
    dataset_id: int
    group: str | None = None
    hours: float = Field(200, ge=0)
    age: float = Field(0, ge=0)
    distribution: Literal["exponential", "weibull"] | None = None

class ChatRequest(BaseModel):
    dataset_id: int
    question: str

class FTestRequest(BaseModel):
    dataset_id: int
    group_a: str
    group_b: str
    alpha: float = Field(.05, gt=0, lt=1)
