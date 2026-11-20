"""Кампании: список, просмотр с потоками, создание (часть 1 задания)."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.keitaro.client import KeitaroClient, get_client
from app.keitaro.schemas import Campaign, Stream
from app.services.campaign_creator import create_adrobot_campaign

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


class CreateCampaignRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    geo: str = Field(min_length=2, max_length=2, description="Код страны, например DE")
    offer_id: int
    domain_id: int
    group_id: int = 0
    traffic_source_id: int


@router.get("")
async def list_campaigns(
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    client: KeitaroClient = Depends(get_client),
) -> list[dict[str, Any]]:
    campaigns = await client.list_campaigns(limit=limit, offset=offset)
    return [Campaign(**c).model_dump(by_alias=True) for c in campaigns]


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: int,
    client: KeitaroClient = Depends(get_client),
) -> dict[str, Any]:
    campaign, streams = await _campaign_with_streams(client, campaign_id)
    return {
        "campaign": campaign,
        "streams": streams,
    }


@router.post("", status_code=201)
async def create_campaign(
    body: CreateCampaignRequest,
    client: KeitaroClient = Depends(get_client),
) -> dict[str, Any]:
    if not body.geo.isalpha():
        raise HTTPException(422, "geo должен быть кодом страны (2 буквы), например DE")
    return await create_adrobot_campaign(
        client,
        name=body.name.strip(),
        geo=body.geo,
        offer_id=body.offer_id,
        domain_id=body.domain_id,
        group_id=body.group_id,
        traffic_source_id=body.traffic_source_id,
    )


async def _campaign_with_streams(client: KeitaroClient, campaign_id: int) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    try:
        campaign_raw = await client.get_campaign(campaign_id)
    except Exception:
        raise HTTPException(404, f"Кампания {campaign_id} не найдена")
    streams_raw = await client.get_campaign_streams(campaign_id)
    campaign = Campaign(**campaign_raw).model_dump(by_alias=True)
    streams = [Stream(**s).model_dump(by_alias=True) for s in streams_raw]
    return campaign, streams
