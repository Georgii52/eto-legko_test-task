# Keitaro Campaign Manager (тестовое задание Adrobot)

Веб-панель для рекламного трекера [Keitaro](https://keitaro.io), работающая
через его Admin API. Задание состоит из двух частей:

**Часть 1 — создание кампании.** Форма принимает название кампании, гео-код
страны и ID оффера Keitaro и создаёт кампанию, у которой:

- поток 1: ловит всех из указанной страны (фильтр `geo`) и редиректит на Google;
- поток 2: default-поток — редиректит на выбранный оффер;
- в кампании настроены домен, группа и источник трафика (выбираются в форме,
  всё берётся из API).

**Часть 2 — редактор офферов.** Выбираешь кампанию → видишь её потоки. Можно:

- добавлять/удалять потоки с оффером в кампании;
- добавлять/удалять офферы внутри потока-ротации;
- после каждой операции доли офферов (share) пересчитываются автоматически
  так, чтобы сумма была ровно 100% — «цифры верные».

## Стек

- **Бэкенд:** Python 3.12+, FastAPI, httpx (асинхронный клиент к Admin API),
  pydantic. Ключ API хранится на бэкенде и не попадает в браузер.
- **Фронтенд:** React 18 + TypeScript, Vite. Чистый React без UI-библиотек,
  стили руками.

## Запуск

Нужны Python ≥ 3.12 и Node.js ≥ 20.

```bash
# 1. Конфиг
cp backend/.env.example backend/.env
# вписать KEITARO_API_KEY (ключ из админки Keitaro)

# 2. Бэкенд
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Фронтенд (в другом терминале)
cd frontend
npm install
npm run dev          # http://localhost:5173, /api проксируется на :8000
```

Для «прод-режима» одним процессом: `npm run build` во `frontend/` — FastAPI
сам раздаст собранную статику из `frontend/dist` на порту 8000.

## API панели

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/dictionaries` | домены, группы, источники, офферы для селектов |
| POST | `/api/campaigns` | создать кампанию с 2 потоками (часть 1) |
| GET | `/api/campaigns` | список кампаний |
| GET | `/api/campaigns/{id}` | кампания + её потоки с офферами и долями |
| POST | `/api/campaigns/{id}/streams` | добавить в кампанию поток с оффером |
| PUT | `/api/streams/{id}/offers` | добавить/удалить оффер в потоке (`action: add\|remove`), пересчёт долей |
| DELETE | `/api/streams/{id}` | удалить поток |

## Как вызывается Admin API Keitaro

Базовый путь: `{KEITARO_BASE_URL}/admin_api/v1`, авторизация — заголовок
`Api-Key` (https://admin-api.docs.keitaro.io/).

Создание кампании (часть 1) — три запроса:

1. `POST /campaigns` — `{name, alias, domain_id, group_id, traffic_source_id}`;
2. `POST /streams` — гео-поток: `schema: "redirect"`, `action_type: "http"`,
   `action_options: {url: "https://google.com"}`,
   `filters: [{name: "geo", mode: "accept", payload: ["DE"]}]`;
3. `POST /streams` — оффер-поток: `type: "default"`, `schema: "landings"`,
   `offers: [{offer_id, share: 100}]`.

Редактирование офферов (часть 2): `GET /streams/{id}` → правка массива
`offers` → `PUT /streams/{id}`; удаление потока — `DELETE /streams/{id}`.

Доли пересчитываются поровну: `100 / n` с распределением остатка первым
офферам (целые числа, сумма всегда ровно 100).

## Структура

```
02-keitaro-campaign-manager/
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py               # FastAPI: роутеры, CORS, статика фронта
│       ├── config.py             # настройки из .env
│       ├── keitaro/
│       │   ├── client.py         # асинхронный клиент Admin API
│       │   └── schemas.py        # pydantic-модели сущностей Keitaro
│       ├── routers/
│       │   ├── dictionaries.py   # GET /api/dictionaries
│       │   ├── campaigns.py      # список / создание кампаний
│       │   └── streams.py        # добавление/удаление офферов и потоков
│       └── services/
│           ├── campaign_creator.py  # логика части 1
│           └── offers_editor.py     # логика части 2 + пересчёт долей
└── frontend/
    ├── vite.config.ts            # dev-прокси /api → :8000
    └── src/
        ├── api.ts                # клиент API панели
        ├── types.ts
        ├── App.tsx               # вкладки «Создание» / «Редактор»
        └── components/
            ├── CampaignCreateForm.tsx
            └── OffersEditor.tsx
```
