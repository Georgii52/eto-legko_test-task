"""Справочники для селектов формы: домены, группы, источники, офферы."""
from typing import Any

from fastapi import APIRouter, Depends

from app.keitaro.client import KeitaroClient, get_client

router = APIRouter(prefix="/api", tags=["dictionaries"])


@router.get("/dictionaries")
async def dictionaries(client: KeitaroClient = Depends(get_client)) -> dict[str, list[dict[str, Any]]]:
    domains, groups, sources, offers = await _load_all(client)
    return {
        "domains": [{"id": d["id"], "name": d["name"]} for d in domains],
        "groups": [{"id": g["id"], "name": g.get("name", f"Group {g['id']}")} for g in groups],
        "traffic_sources": [{"id": s["id"], "name": s["name"]} for s in sources],
        "offers": [
            {
                "id": o["id"],
                "name": o["name"],
                "state": o.get("state"),
                "country": o.get("country") or [],
                "group": o.get("group"),
            }
            for o in offers
        ],
    }


async def _load_all(client: KeitaroClient):
    # справочники запрашиваем параллельно — это 4 независимых запроса
    import asyncio

    return await asyncio.gather(
        client.list_domains(),
        client.list_groups(),
        client.list_traffic_sources(),
        client.list_offers(),
    )
