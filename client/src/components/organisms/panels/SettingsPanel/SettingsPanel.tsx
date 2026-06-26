"use client";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { Toggle } from "@/components/atoms/Toggle/Toggle";
import { Field } from "@/components/molecules/Field/Field";
import { Segmented } from "@/components/molecules/Segmented/Segmented";
import { Icon } from "@/design/icons";
import { isLive, statusText } from "@/lib/ai";
import { ACCENTS, KINDS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Kind, ThemeMode } from "@/lib/store/types";
import { cx, downloadText } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./SettingsPanel.module.css";

export function SettingsPanel() {
  useStoreVersion();
  const { toast, confirm } = useWorkspace();
  const set = store.settings();
  const live = isLive();
  const total = (Object.keys(KINDS) as Kind[]).reduce((n, k) => n + store.list(k).length, 0);

  return (
    <div className={s.root}>
      <div className={s.set}>
        <section className={s.section}>
          <h3 className={s.head}>
            <Icon name="user" /> Profile
          </h3>
          <div className={s.body}>
            <Field label="Display name">
              <Input value={set.name} onChange={(e) => store.setSetting({ name: e.target.value })} />
            </Field>
            <Field label="Plan">
              <Select value={set.plan} onChange={(e) => store.setSetting({ plan: e.target.value })}>
                <option>Free plan</option>
                <option>Pro plan</option>
                <option>Team plan</option>
              </Select>
            </Field>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.head}>
            <Icon name="palette" /> Appearance
          </h3>
          <div className={s.body}>
            <div className={s.row}>
              <div className={s.rowLabel}>
                <strong>Theme</strong>
                <small>Match the system, or pick light / dark.</small>
              </div>
              <div className={s.rowCtl}>
                <Segmented<ThemeMode>
                  options={[
                    { value: "system", label: "System" },
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                  ]}
                  value={set.theme}
                  onChange={(v) => store.setSetting({ theme: v })}
                />
              </div>
            </div>
            <div className={s.row}>
              <div className={s.rowLabel}>
                <strong>Accent colour</strong>
                <small>One accent keeps the workspace calm.</small>
              </div>
              <div className={cx(s.rowCtl, s.accents)}>
                {Object.entries(ACCENTS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    className={cx(s.accent, set.accent === k && s.accentOn)}
                    style={{ background: v[0] }}
                    title={k}
                    aria-label={k}
                    onClick={() => store.setSetting({ accent: k })}
                  />
                ))}
              </div>
            </div>
            <div className={s.row}>
              <div className={s.rowLabel}>
                <strong>Reduce motion</strong>
                <small>Minimise animations and transitions.</small>
              </div>
              <div className={s.rowCtl}>
                <Toggle on={set.reduceMotion} onChange={(v) => store.setSetting({ reduceMotion: v })} aria-label="Reduce motion" />
              </div>
            </div>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.head}>
            <Icon name="cpu" /> AI engine
          </h3>
          <div className={s.body}>
            <div className={s.statusrow}>
              <span className={cx(s.status, live ? s.statusLive : s.statusMock)} />
              <span className={s.statusText}>{statusText()}</span>
            </div>
            <Field label="Model">
              <Select value={set.model} onChange={(e) => store.setSetting({ model: e.target.value })}>
                <option value="claude-opus-4-8">Claude Opus 4.8</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
              </Select>
            </Field>
            <Field label="Claude API key" hint="Stored only in this browser; sent directly to api.anthropic.com.">
              <Input type="password" placeholder="sk-ant-…" value={set.apiKey} onChange={(e) => store.setSetting({ apiKey: e.target.value })} />
            </Field>
            <Field label="System prompt (optional)">
              <Textarea rows={3} placeholder="You are a helpful assistant…" value={set.systemPrompt} onChange={(e) => store.setSetting({ systemPrompt: e.target.value })} />
            </Field>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.head}>
            <Icon name="db" /> Your data
          </h3>
          <div className={s.body}>
            <p className={s.hint}>
              {total} items across {store.projects().length} projects, saved in this browser&apos;s localStorage.
            </p>
            <div className={s.row}>
              <div className={s.rowLabel}>
                <strong>Export workspace</strong>
                <small>Download everything as JSON.</small>
              </div>
              <div className={s.rowCtl}>
                <Button icon="download" onClick={() => { downloadText("synapse-export.json", store.exportAll()); toast("Exported", "ok"); }}>
                  Export
                </Button>
              </div>
            </div>
            <div className={s.row}>
              <div className={s.rowLabel}>
                <strong>Reset workspace</strong>
                <small>Delete everything and reseed the demo.</small>
              </div>
              <div className={s.rowCtl}>
                <Button
                  variant="danger"
                  icon="trash"
                  onClick={async () => {
                    if (await confirm("Delete everything and reseed the demo workspace?", { title: "Reset", okText: "Reset", danger: true })) {
                      store.reset();
                      toast("Workspace reset", "ok");
                    }
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.head}>
            <Icon name="info" /> About
          </h3>
          <div className={s.body}>
            <p className={s.hint}>
              synapse — an AI workspace migrated to Next.js with a token-driven, atomic design system. Chat, files, notes, tasks, prompts, memory, a
              terminal and source control in one IDE-style app.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
