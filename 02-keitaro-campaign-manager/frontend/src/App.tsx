import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Campaign, CampaignWithStreams, Dictionaries } from "./types";
import { CampaignCreateForm } from "./components/CampaignCreateForm";
import { OffersEditor } from "./components/OffersEditor";

type Tab = "create" | "edit";

export default function App() {
  const [tab, setTab] = useState<Tab>("create");
  const [dictionaries, setDictionaries] = useState<Dictionaries | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [created, setCreated] = useState<CampaignWithStreams | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const reloadCampaigns = useCallback(async () => {
    try {
      setCampaigns(await api.campaigns());
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Не удалось получить кампании");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setDictionaries(await api.dictionaries());
        await reloadCampaigns();
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : "Ошибка загрузки справочников");
      }
    })();
  }, [reloadCampaigns]);

  if (globalError) {
    return <div className="error big">Ошибка: {globalError}</div>;
  }
  if (!dictionaries) {
    return <div className="hint big">Загрузка…</div>;
  }

  return (
    <div className="layout">
      <header>
        <h1>Keitaro Campaign Manager</h1>
        <nav>
          <button className={tab === "create" ? "tab active" : "tab"} onClick={() => setTab("create")}>
            Создание кампании
          </button>
          <button className={tab === "edit" ? "tab active" : "tab"} onClick={() => setTab("edit")}>
            Редактор офферов
          </button>
        </nav>
      </header>

      {tab === "create" && (
        <>
          <CampaignCreateForm
            dictionaries={dictionaries}
            onCreated={(result) => {
              setCreated(result);
              void reloadCampaigns();
            }}
          />
          {created && <CreatedResult result={created} />}
        </>
      )}

      {tab === "edit" && (
        <OffersEditor dictionaries={dictionaries} campaigns={campaigns} reloadCampaigns={reloadCampaigns} />
      )}
    </div>
  );
}

function CreatedResult({ result }: { result: CampaignWithStreams }) {
  const { campaign, streams } = result;
  return (
    <div className="panel success">
      <h2>Кампания создана ✓</h2>
      <div>
        {campaign.name} · id {campaign.id}
        {campaign.alias && campaign.domain && (
          <>
            {" · "}
            <code>
              {campaign.domain.replace(/\/$/, "")}/{campaign.alias}
            </code>
          </>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th>Поток</th>
            <th>Тип</th>
            <th>Правило</th>
            <th>Куда</th>
          </tr>
        </thead>
        <tbody>
          {streams.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.type === "default" ? "все остальные" : "гео-фильтр"}</td>
              <td>
                {s.filters
                  .map((f) => `${f.name} ${f.mode} ${(f.payload ?? []).join(", ")}`)
                  .join("; ") || "—"}
              </td>
              <td>
                {(s.action_options as { url?: string } | null)?.url ??
                  (s.offers.length > 0
                    ? `оффер ${s.offers.map((o) => o.offer_id).join(", ")}`
                    : "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
