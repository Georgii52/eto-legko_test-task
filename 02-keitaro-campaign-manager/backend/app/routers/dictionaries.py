"""Справочники для селектов формы: домены, группы, источники, офферы."""
from typing import Any

from fastapi import APIRouter, Depends

from app.keitaro.client import KeitaroApiError, KeitaroClient, get_client

router = APIRouter(prefix="/api", tags=["dictionaries"])


@router.get("/dictionaries")
async def dictionaries(client: KeitaroClient = Depends(get_client)) -> dict[str, list[dict[str, Any]]]:
    domains, groups, sources, offers, errors = await _load_all(client)
    if not domains and not sources and not offers and not groups:
        # все разделы недоступны — отдаём первую ошибку как есть
        raise errors[0] if errors else KeitaroApiError(502, "Справочники недоступны")
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
    """Справочники запрашиваем параллельно; каждый — независимо.

    Если какой-то раздел недоступен (нет прав у аккаунта Keitaro),
    возвращаем для него пустой список, а не роняем всю страницу.
    """
    import asyncio

    results = await asyncio.gather(
        client.list_domains(),
        client.list_groups(),
        client.list_traffic_sources(),
        client.list_offers(),
        return_exceptions=True,
    )
    errors = [r for r in results if isinstance(r, Exception)]
    cleared = [r if isinstance(r, list) else [] for r in results]
    return *cleared, errors
