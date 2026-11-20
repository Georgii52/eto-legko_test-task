"""Часть 2 задания: редактор офферов в кампании.

- добавление/удаление потока с оффером в кампании;
- добавление/удаление офферов внутри потока-ротации (схема «landings»);
- доли (share) офферов после каждой операции пересчитываются так,
  чтобы в сумме давать ровно 100.
"""
from typing import Any

from app.keitaro.client import KeitaroClient
from app.keitaro.schemas import Stream


def equal_shares(count: int) -> list[int]:
    """Разворачивает 100 на count равных целых долей (остаток — первым офферам)."""
    if count <= 0:
        return []
    base, remainder = divmod(100, count)
    return [base + (1 if i < remainder else 0) for i in range(count)]


async def _get_offer_stream(client: KeitaroClient, stream_id: int) -> dict[str, Any]:
    return await client.get_stream(stream_id)


async def add_offer_to_stream(client: KeitaroClient, stream_id: int, offer_id: int) -> dict[str, Any]:
    stream = await _get_offer_stream(client, stream_id)
    offers: list[dict[str, Any]] = list(stream.get("offers") or [])
    if any(int(o["offer_id"]) == offer_id for o in offers):
        raise ValueError(f"Оффер {offer_id} уже есть в потоке {stream_id}")

    offers.append({"offer_id": offer_id, "share": 0, "state": "active"})
    shares = equal_shares(len(offers))
    for offer, share in zip(offers, shares):
        offer["share"] = share

    updated = await client.update_stream(stream_id, {"offers": offers})
    return Stream(**updated).model_dump(by_alias=True)


async def remove_offer_from_stream(client: KeitaroClient, stream_id: int, offer_id: int) -> dict[str, Any]:
    stream = await _get_offer_stream(client, stream_id)
    offers = [o for o in (stream.get("offers") or []) if int(o["offer_id"]) != offer_id]
    if len(offers) == len(stream.get("offers") or []):
        raise ValueError(f"Оффера {offer_id} нет в потоке {stream_id}")

    shares = equal_shares(len(offers))
    for offer, share in zip(offers, shares):
        offer["share"] = share

    updated = await client.update_stream(stream_id, {"offers": offers})
    return Stream(**updated).model_dump(by_alias=True)


async def add_offer_stream(client: KeitaroClient, campaign_id: int, offer_id: int) -> dict[str, Any]:
    """Добавляет в кампанию отдельный поток с одним оффером."""
    created = await client.create_stream(
        {
            "campaign_id": campaign_id,
            "name": f"Offer {offer_id}",
            "type": "regular",
            "schema": "landings",
            "action_type": "http",
            "state": "active",
            "weight": 1,
            "offers": [{"offer_id": offer_id, "share": 100, "state": "active"}],
        }
    )
    return Stream(**created).model_dump(by_alias=True)
