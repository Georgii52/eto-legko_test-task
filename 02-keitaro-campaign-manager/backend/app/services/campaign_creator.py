"""Часть 1 задания: создание кампании с двумя потоками.

Поток 1: ловит всех из указанной страны и редиректит на Google.
Поток 2: default-поток — редиректит на выбранный оффер.
Домен, группа и источник трейсфа настраиваются в самой кампании.
"""
import re
import secrets
from typing import Any

from app.keitaro.client import KeitaroClient
from app.keitaro.schemas import Campaign, Stream

GOOGLE_URL = "https://google.com"


def make_alias(name: str) -> str:
    """Алиас из имени кампании (латиница/цифры) + случайный хвост для уникальности."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:32] or "campaign"
    return f"{slug}-{secrets.token_hex(2)}"


async def create_adrobot_campaign(
    client: KeitaroClient,
    *,
    name: str,
    geo: str,
    offer_id: int,
    domain_id: int,
    group_id: int,
    traffic_source_id: int,
) -> dict[str, Any]:
    geo = geo.strip().upper()

    campaign = await client.create_campaign(
        {
            "name": name,
            "alias": make_alias(name),
            "domain_id": domain_id,
            "group_id": group_id,
            "traffic_source_id": traffic_source_id,
            "type": "position",
            "state": "active",
        }
    )
    campaign_id = int(campaign["id"])

    google_stream = await client.create_stream(
        {
            "campaign_id": campaign_id,
            "name": f"{geo} → Google",
            "type": "regular",
            "schema": "redirect",
            "action_type": "http",
            "action_options": {"url": GOOGLE_URL},
            "state": "active",
            "weight": 1,
            "position": 1,
            "filters": [{"name": "country", "mode": "accept", "payload": [geo]}],
        }
    )

    offer_stream = await client.create_stream(
        {
            "campaign_id": campaign_id,
            "name": "Offer",
            "type": "default",
            "schema": "landings",
            "action_type": "http",
            "state": "active",
            "weight": 1,
            "position": 2,
            "offers": [{"offer_id": offer_id, "share": 100, "state": "active"}],
        }
    )

    return {
        "campaign": Campaign(**campaign).model_dump(by_alias=True),
        "streams": [
            Stream(**google_stream).model_dump(by_alias=True),
            Stream(**offer_stream).model_dump(by_alias=True),
        ],
    }
