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
- Admin-Code liegt unter `assets/js/admin/` und verwendet ausschliesslich `/api/admin/*` fuer schreibende und vollstaendige Datensaetze.
- Gemeinsame Server-Datenlogik liegt in `netlify/functions/_shared/`; Public-Handler geben daraus nur explizit sanitizte Public-Objekte aus.
- Public- und Admin-Views fuer Public-Content-Settings sind getrennt: `public-settings-data.mjs` enthaelt nur Public-Ausgabe, `admin-public-settings-data.mjs` nur Admin-Sanitizing und Admin-Ausgabe.
- Oeffentliche Formulare speichern direkt ueber die Public-API-Endpunkte. Die alte Netlify-Forms/Discord-Hook-Doppelstrecke wird nicht mehr verwendet.

## Admin-Zugang

Der Adminbereich unter `/lg-dashboard.html` ist per Login geschützt. Setze in Netlify mindestens diese Umgebungsvariable:

- `ADMIN_PASSWORD` - Passwort für den Admin-Login

Optional kann `ADMIN_SESSION_SECRET` gesetzt werden, um die Session-Cookies unabhängig vom Passwort zu signieren.

---

**Lizenz**  
*(Hier kannst du deine gewünschte Lizenz einfügen, z. B. MIT, GPL, etc.)*
