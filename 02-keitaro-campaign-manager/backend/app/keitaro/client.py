"""Асинхронный клиент Admin API Keitaro.

Документация: https://admin-api.docs.keitaro.io/
Базовый путь: {KEITARO_BASE_URL}/admin_api/v1, авторизация — заголовок Api-Key.
"""
from typing import Any

import httpx

from app.config import settings


class KeitaroApiError(Exception):
    """Ошибка на стороне Keitaro (HTTP 4xx/5xx или невалидный ответ)."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class KeitaroClient:
    def __init__(self, base_url: str, api_key: str) -> None:
        self._endpoint = base_url.rstrip("/") + "/admin_api/v1"
        self._api_key = api_key

    def _headers(self) -> dict[str, str]:
        return {"Api-Key": self._api_key}

    async def _request(self, method: str, path: str, json_body: Any = None) -> Any:
        url = f"{self._endpoint}{path}"
        async with httpx.AsyncClient(timeout=30) as http:
            response = await http.request(method, url, json=json_body, headers=self._headers())
        if response.status_code >= 400:
            try:
                detail = response.json().get("error", response.text)
            except Exception:
                detail = response.text
            raise KeitaroApiError(response.status_code, str(detail))
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    # --- справочники -------------------------------------------------

    async def list_domains(self) -> list[dict[str, Any]]:
        return await self._request("GET", "/domains")

    async def list_groups(self) -> list[dict[str, Any]]:
        return await self._request("GET", "/groups")

    async def list_traffic_sources(self) -> list[dict[str, Any]]:
        return await self._request("GET", "/traffic_sources")

    async def list_offers(self) -> list[dict[str, Any]]:
        return await self._request("GET", "/offers")

    # --- кампании ----------------------------------------------------

    async def list_campaigns(self, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        return await self._request("GET", f"/campaigns?limit={limit}&offset={offset}")

    async def create_campaign(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/campaigns", payload)

    async def get_campaign(self, campaign_id: int) -> dict[str, Any]:
        return await self._request("GET", f"/campaigns/{campaign_id}")

    async def get_campaign_streams(self, campaign_id: int) -> list[dict[str, Any]]:
        return await self._request("GET", f"/campaigns/{campaign_id}/streams")

    # --- потоки ------------------------------------------------------

    async def create_stream(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/streams", payload)

    async def get_stream(self, stream_id: int) -> dict[str, Any]:
        return await self._request("GET", f"/streams/{stream_id}")

    async def update_stream(self, stream_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("PUT", f"/streams/{stream_id}", payload)

    async def delete_stream(self, stream_id: int) -> None:
        await self._request("DELETE", f"/streams/{stream_id}")


def get_client() -> KeitaroClient:
    if not settings.keitaro_api_key:
        raise KeitaroApiError(500, "KEITARO_API_KEY не задан — заполните .env (см. .env.example)")
    return KeitaroClient(settings.keitaro_base_url, settings.keitaro_api_key)
