# Clan‑Leider‑Geil

Willkommen bei **Clan Leider‑Geil** – deine zentrale Anlaufstelle für Gaming‑Streams, Events und Community‑Chat!

> **Streams**  
> - Twitch: [sgtsnickersnevergiveup](https://www.twitch.tv/sgtsnickersnevergiveup)  
> - YouTube: *(Live‑Video‑ID eintragen)*

> **Discord‑Server**: https://discord.gg/dCxDZnMXbu  
> (Server‑ID: **1123970503435100211**)

## Links

- [Discord‑Server](https://discord.gg/dCxDZnMXbu)  
- [Twitch‑Channel](https://www.twitch.tv/sgtsnickersnevergiveup)  
- [YouTube](https://www.youtube.com)  

> **Hinweis** – Inhalte werden über die getrennten Pflegeoberflächen und API-Endpunkte verwaltet.

## Code-Grenzen

- Public-/Index-Code liegt unter `assets/js/public/` und spricht nur die oeffentlichen `/api/*`-Endpunkte an.
- Admin-Code liegt unter `assets/js/admin/` und verwendet ausschliesslich `/api/admin/*` fuer schreibende, vollstaendige Datensaetze und geschuetzte Media-Vorschauen.
- Admin-Editoren fuer Startseiten-Inhalte liegen gebuendelt unter `assets/js/admin/homepage-content/` und werden im Dashboard nur ueber einen registrierten Admin-Page-Loader (`page.js`, nicht `index.js`) geladen.
- `npm test` ordnet bekannte Admin-HTML-Einstiege explizit zu und prueft Script-/Stylesheet-Allowlists, Inline-Script-Grenzen, Admin-Script-Reihenfolge sowie rekursiv alle Public-/Admin-Browser-Skripte gegen Boundary-Leaks.
- Gemeinsame Server-Datenlogik liegt in `netlify/functions/_shared/`; Public-Handler geben daraus nur explizit sanitizte Public-Objekte aus.
- Public- und Admin-Netlify-Handler duerfen nicht gegenseitig die jeweiligen Projection-/Mutation-Helper importieren; neutrale Store-/Schema-Helfer bleiben in `_shared/` erlaubt (`homepage-content-settings-schema.mjs` fuer Startseiten-Settings).
- Netlify-Functions und Edge-Routen werden gegen Public-/Admin-API-Pfade, Projection-Imports und die Admin-Auth-Routen in `netlify.toml` geprueft.
- Public- und Admin-Views fuer Startseiten-Settings sind getrennt: `public-settings-data.mjs` enthaelt nur Public-Ausgabe (`entries/memberId`), `admin-public-settings-data.mjs` nur Admin-Sanitizing und Admin-Ausgabe (`members/id`).
- Oeffentliche Formulare speichern direkt ueber die Public-API-Endpunkte. Die alte Netlify-Forms/Discord-Hook-Doppelstrecke wird nicht mehr verwendet.

## Admin-Zugang

Der Adminbereich unter `/lg-dashboard.html` ist per Login geschützt. Setze in Netlify mindestens diese Umgebungsvariable:

- `ADMIN_PASSWORD` - Passwort für den Admin-Login

Optional kann `ADMIN_SESSION_SECRET` gesetzt werden, um die Session-Cookies unabhängig vom Passwort zu signieren.

---

**Lizenz**  
*(Hier kannst du deine gewünschte Lizenz einfügen, z. B. MIT, GPL, etc.)*
