import { useState, useRef } from "react";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { ELEMENTS, SEALS, useArenaSettings } from "../lib/arena-settings";
import { unlockArenaAudio } from "../lib/arena-audio";
import { ArenaAvatar } from "./arena-avatar";
export function ArenaControls() {
  const { settings: s, update, warning } = useArenaSettings();
  const [error, setError] = useState("");
  const upload = useRef(0);
  async function photo(file?: File) {
    const token = ++upload.current;
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5000000) {
      setError("Choisis une image PNG, JPEG ou WebP de moins de 5 Mo.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 120;
      const c = canvas.getContext("2d");
      if (!c) throw new Error();
      const m = Math.min(bitmap.width, bitmap.height);
      c.drawImage(bitmap, (bitmap.width - m) / 2, (bitmap.height - m) / 2, m, m, 0, 0, 120, 120);
      bitmap.close();
      if (token !== upload.current) return;
      update({ photo: canvas.toDataURL("image/png"), avatar: "photo" });
      setError("");
    } catch {
      setError("Cette image n’a pas pu être lue.");
    }
  }
  return (
    <details className="arena-controls">
      <summary>
        <Sparkles size={17} /> Habillage de l’arène{" "}
        <span>
          {ELEMENTS[s.element]} · {SEALS[s.seal]}
        </span>
      </summary>
      <div className="arena-controls-body">
        <p>Effets cosmétiques uniquement. Après le premier pion, le temps continue pendant les réglages.</p>
        <div className="arena-selects">
          <label>
            Style du coup
            <select
              aria-label="Style du coup"
              value={s.element}
              onChange={(e) => update({ element: Number(e.target.value) })}
            >
              {ELEMENTS.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scellement de la zone
            <select
              aria-label="Scellement de la zone"
              value={s.seal}
              onChange={(e) => update({ seal: Number(e.target.value) })}
            >
              {SEALS.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="arena-toggles">
          <button
            type="button"
            aria-pressed={s.effects}
            onClick={() => update({ effects: !s.effects })}
          >
            Effets : {s.effects ? "oui" : "non"}
          </button>
          <button
            type="button"
            aria-pressed={s.sound}
            onClick={async () => {
              if (s.sound) {
                update({ sound: false });
                return;
              }
              const ok = await unlockArenaAudio();
              update({ sound: ok });
              setError(ok ? "" : "Audio indisponible sur ce navigateur.");
            }}
          >
            {s.sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Son :{" "}
            {s.sound ? "oui" : "non"}
          </button>
        </div>
        <div className="arena-avatar-editor">
          <ArenaAvatar settings={s} />
          <div>
            <label>
              Mon avatar local
              <select
                aria-label="Mon avatar local"
                value={s.avatar}
                onChange={(e) => {
                  ++upload.current;
                  update({ avatar: e.target.value as typeof s.avatar });
                }}
              >
                <option value="ninja">Ninja</option>
                <option value="samurai">Samouraï</option>
                <option value="mage">Mage</option>
                {s.photo && <option value="photo">Photo</option>}
              </select>
            </label>
            <label className="arena-upload">
              Importer une photo
              <input
                type="file"
                aria-label="Importer une photo"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  void photo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {s.photo && (
              <button
                type="button"
                onClick={() => {
                  ++upload.current;
                  update({ photo: "", avatar: s.avatar === "photo" ? "ninja" : s.avatar });
                }}
              >
                Retirer la photo
              </button>
            )}
          </div>
        </div>
        <div className="arena-colors">
          {(
            [
              ["hair", "Cheveux"],
              ["skin", "Peau"],
              ["eyes", "Yeux"],
              ["cloth", "Vêtement"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="color"
                aria-label={label}
                value={s[key]}
                onChange={(e) => update({ [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <p>
          Avatar et préférences sur cet appareil seulement. Ta photo n’est ni envoyée au serveur ni
          montrée à l’adversaire.
        </p>
        <output aria-live="polite">{error || warning}</output>
      </div>
    </details>
  );
}
