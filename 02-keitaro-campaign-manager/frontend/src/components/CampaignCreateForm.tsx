import { FormEvent, useState } from "react";
import { api } from "../api";
import type { CampaignWithStreams, Dictionaries, Offer } from "../types";

interface Props {
  dictionaries: Dictionaries;
  onCreated: (result: CampaignWithStreams) => void;
}

/** Часть 1 задания: форма «название + гео + оффер (+ домен/группа/источник)». */
export function CampaignCreateForm({ dictionaries, onCreated }: Props) {
  const [name, setName] = useState("");
  const [geo, setGeo] = useState("");
  const [offerId, setOfferId] = useState<number | "">("");
  const [domainId, setDomainId] = useState<number | "">(
    dictionaries.domains[0]?.id ?? "",
  );
  const [groupId, setGroupId] = useState<number>(0);
  const [sourceId, setSourceId] = useState<number | "">(
    dictionaries.traffic_sources[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !geo.trim() || offerId === "" || sourceId === "" || domainId === "") {
      setError("Заполните название, гео, оффер, домен и источник");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.createCampaign({
        name: name.trim(),
        geo: geo.trim().toUpperCase(),
        offer_id: Number(offerId),
        domain_id: Number(domainId),
        group_id: Number(groupId),
        traffic_source_id: Number(sourceId),
      });
      onCreated(result);
      setName("");
      setGeo("");
      setOfferId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Создание кампании</h2>
      <p className="hint">
        Кампания получит 2 потока: выбранный гео → Google, все остальные → оффер.
      </p>

      <div className="field-grid">
        <label>
          Название кампании
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Adrobot test 1"
          />
        </label>

        <label>
          Гео (код страны)
          <input
            value={geo}
            onChange={(e) => setGeo(e.target.value.toUpperCase())}
            placeholder="DE"
            maxLength={2}
          />
        </label>

        <label>
          Оффер Keitaro
          <OfferSelect offers={dictionaries.offers} value={offerId} onChange={setOfferId} />
        </label>

        <label>
          Домен
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            {dictionaries.domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Группа
          <select value={groupId} onChange={(e) => setGroupId(Number(e.target.value))}>
            <option value={0}>Без группы</option>
            {dictionaries.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Источник трафика
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            {dictionaries.traffic_sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" className="primary" disabled={submitting}>
        {submitting ? "Создаём…" : "Создать кампанию"}
      </button>
    </form>
  );
}

function OfferSelect({
  offers,
  value,
  onChange,
}: {
  offers: Offer[];
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}>
      <option value="">— выберите оффер —</option>
      {offers.map((o) => (
        <option key={o.id} value={o.id}>
          {o.id} — {o.name}
        </option>
      ))}
    </select>
  );
}
