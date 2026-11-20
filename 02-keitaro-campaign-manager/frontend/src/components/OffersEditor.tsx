import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Campaign, CampaignWithStreams, Dictionaries, Stream } from "../types";

interface Props {
  dictionaries: Dictionaries;
  campaigns: Campaign[];
  reloadCampaigns: () => void;
}

/** Часть 2 задания: добавление/удаление офферов в кампании, доли считаются верно. */
export function OffersEditor({ dictionaries, campaigns, reloadCampaigns }: Props) {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [data, setData] = useState<CampaignWithStreams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: number) => {
    setBusy(true);
    setError(null);
    try {
      setData(await api.campaign(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить кампанию");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId !== "") void load(selectedId);
  }, [selectedId, load]);

  const mutate = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (selectedId !== "") {
        setData(await api.campaign(selectedId));
        reloadCampaigns();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setBusy(false);
    }
  };

  const usedOfferIds = useMemo(() => {
    const ids = new Set<number>();
    for (const s of data?.streams ?? []) for (const o of s.offers) ids.add(o.offer_id);
    return ids;
  }, [data]);

  return (
    <div>
      <div className="panel">
        <h2>Редактор офферов</h2>
        <label>
          Кампания
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">— выберите кампанию —</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name}
              </option>
            ))}
          </select>
        </label>
        {busy && <div className="hint">Загрузка…</div>}
        {error && <div className="error">{error}</div>}
      </div>

      {data && (
        <>
          <StreamList
            streams={data.streams}
            dictionaries={dictionaries}
            usedOfferIds={usedOfferIds}
            onMutate={mutate}
          />
          <AddStreamPanel campaignId={data.campaign.id} dictionaries={dictionaries} usedOfferIds={usedOfferIds} onMutate={mutate} />
        </>
      )}
    </div>
  );
}

function StreamList({
  streams,
  dictionaries,
  usedOfferIds,
  onMutate,
}: {
  streams: Stream[];
  dictionaries: Dictionaries;
  usedOfferIds: Set<number>;
  onMutate: (fn: () => Promise<unknown>) => void;
}) {
  return (
    <>
      {streams.map((stream) => (
        <StreamCard
          key={stream.id}
          stream={stream}
          dictionaries={dictionaries}
          usedOfferIds={usedOfferIds}
          onMutate={onMutate}
        />
      ))}
    </>
  );
}

function StreamCard({
  stream,
  dictionaries,
  usedOfferIds,
  onMutate,
}: {
  stream: Stream;
  dictionaries: Dictionaries;
  usedOfferIds: Set<number>;
  onMutate: (fn: () => Promise<unknown>) => void;
}) {
  const [addOfferId, setAddOfferId] = useState<number | "">("");
  const offerName = (id: number) =>
    dictionaries.offers.find((o) => o.id === id)?.name ?? `Offer ${id}`;

  const totalShare = stream.offers.reduce((sum, o) => sum + o.share, 0);
  const isOfferRotation = stream.offers.length > 0;
  const freeOffers = dictionaries.offers.filter((o) => !usedOfferIds.has(o.id));

  const actionLabel = describeAction(stream);

  return (
    <div className="panel stream-card">
      <div className="stream-head">
        <strong>{stream.name}</strong>
        <span className="chip">
          {stream.type === "default" ? "default (все остальные)" : stream.type}
        </span>
        <span className="chip">{actionLabel}</span>
        <button
          className="danger"
          onClick={() =>
            onMutate(() => api.deleteStream(stream.id))
          }
        >
          Удалить поток
        </button>
      </div>

      {isOfferRotation ? (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Оффер</th>
                <th>Доля, %</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stream.offers.map((o) => (
                <tr key={o.offer_id}>
                  <td>{o.offer_id}</td>
                  <td>{offerName(o.offer_id)}</td>
                  <td className="num">{o.share}</td>
                  <td>
                    <button
                      className="danger small"
                      onClick={() =>
                        onMutate(() => api.mutateOffers(stream.id, "remove", o.offer_id))
                      }
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="hint">Сумма долей: {totalShare}%</div>

          <div className="row">
            <select value={addOfferId} onChange={(e) => setAddOfferId(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">— оффер для добавления —</option>
              {freeOffers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.name}
                </option>
              ))}
            </select>
            <button
              className="primary"
              disabled={addOfferId === ""}
              onClick={() => {
                if (addOfferId !== "") {
                  onMutate(() => api.mutateOffers(stream.id, "add", addOfferId));
                  setAddOfferId("");
                }
              }}
            >
              Добавить оффер
            </button>
          </div>
        </>
      ) : (
        <div className="hint">
          Поток без ротации офферов (редирект). Фильтры:{" "}
          {stream.filters.length === 0
            ? "нет"
            : stream.filters
                .map((f) => `${f.name} ${f.mode} ${(f.payload ?? []).join(", ")}`)
                .join("; ")}
        </div>
      )}
    </div>
  );
}

function AddStreamPanel({
  campaignId,
  dictionaries,
  usedOfferIds,
  onMutate,
}: {
  campaignId: number;
  dictionaries: Dictionaries;
  usedOfferIds: Set<number>;
  onMutate: (fn: () => Promise<unknown>) => void;
}) {
  const [offerId, setOfferId] = useState<number | "">("");
  const freeOffers = dictionaries.offers.filter((o) => !usedOfferIds.has(o.id));

  return (
    <div className="panel">
      <h3>Добавить поток с оффером в кампанию</h3>
      <div className="row">
        <select value={offerId} onChange={(e) => setOfferId(e.target.value === "" ? "" : Number(e.target.value))}>
          <option value="">— оффер —</option>
          {freeOffers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} — {o.name}
            </option>
          ))}
        </select>
        <button
          className="primary"
          disabled={offerId === ""}
          onClick={() => {
            if (offerId !== "") {
              onMutate(() => api.addOfferStream(campaignId, offerId));
              setOfferId("");
            }
          }}
        >
          Добавить поток
        </button>
      </div>
    </div>
  );
}

function describeAction(stream: Stream): string {
  if (stream.action_type === "http" || stream.schema === "redirect") {
    const url = (stream.action_options as { url?: string } | null)?.url;
    return url ? `редирект → ${url}` : "редирект";
  }
  return stream.schema ?? "—";
}
