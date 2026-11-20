"""Потоки: добавление/удаление офферов (часть 2 задания)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.keitaro.client import KeitaroClient, get_client
from app.services.offers_editor import (
    add_offer_stream,
    add_offer_to_stream,
    remove_offer_from_stream,
)

router = APIRouter(prefix="/api", tags=["streams"])


class OfferMutation(BaseModel):
    action: str  # "add" | "remove"
    offer_id: int


class AddStreamRequest(BaseModel):
    offer_id: int


@router.post("/campaigns/{campaign_id}/streams", status_code=201)
async def create_offer_stream(
    campaign_id: int,
    body: AddStreamRequest,
    client: KeitaroClient = Depends(get_client),
) -> dict:
    return await add_offer_stream(client, campaign_id, body.offer_id)


@router.put("/streams/{stream_id}/offers")
async def mutate_stream_offers(
    stream_id: int,
    body: OfferMutation,
    client: KeitaroClient = Depends(get_client),
) -> dict:
    try:
        if body.action == "add":
            return await add_offer_to_stream(client, stream_id, body.offer_id)
        if body.action == "remove":
            return await remove_offer_from_stream(client, stream_id, body.offer_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    raise HTTPException(422, "action должен быть 'add' или 'remove'")


@router.delete("/streams/{stream_id}", status_code=204)
async def delete_stream(
    stream_id: int,
    client: KeitaroClient = Depends(get_client),
) -> None:
    await client.delete_stream(stream_id)
