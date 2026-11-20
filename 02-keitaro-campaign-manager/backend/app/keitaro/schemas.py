"""Pydantic-модели сущностей Keitaro (то, что возвращаем фронту)."""
from typing import Any

from pydantic import BaseModel, Field


class Offer(BaseModel):
    id: int
    name: str
    state: str | None = None
    country: list[str] = []
    group: str | None = None

    model_config = {"extra": "ignore"}


class DictionaryItem(BaseModel):
    id: int
    name: str

    model_config = {"extra": "ignore"}


class StreamOffer(BaseModel):
    offer_id: int
    share: int
    state: str | None = None


class Stream(BaseModel):
    id: int
    name: str
    type: str | None = None
    stream_schema: str | None = Field(default=None, alias="schema")
    action_type: str | None = None
    state: str | None = None
    weight: float | None = None
    offers: list[StreamOffer] = []
    filters: list[dict[str, Any]] = []
    action_options: dict[str, Any] = {}

    model_config = {"extra": "ignore", "populate_by_name": True}


class Campaign(BaseModel):
    id: int
    name: str
    alias: str | None = None
    state: str | None = None
    domain: str | None = None
    group_id: int | None = None
    traffic_source_id: int | None = None
    token: str | None = None

    model_config = {"extra": "ignore"}
