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

## API-Trennung

- Öffentliche Seiten verwenden nur Public-Endpunkte wie `/api/roster`, `/api/events`, `/api/settings`, `/api/applications` und `/api/event-registrations`.
- Schreibende Pflege- und Moderationsfunktionen liegen getrennt unter `/api/admin/...` und sind durch den Admin-Login geschützt.
- Medien-Uploads laufen über Admin-Endpunkte; die gespeicherten Bild-URLs bleiben öffentliche GET-Ressourcen wie `/api/event-image` oder `/api/roster-avatar`.

## Admin-Zugang

Der Adminbereich unter `/lg-dashboard.html` ist per Login geschützt. Setze in Netlify mindestens diese Umgebungsvariable:

- `ADMIN_PASSWORD` - Passwort für den Admin-Login

Optional kann `ADMIN_SESSION_SECRET` gesetzt werden, um die Session-Cookies unabhängig vom Passwort zu signieren.

---

**Lizenz**  
*(Hier kannst du deine gewünschte Lizenz einfügen, z. B. MIT, GPL, etc.)*
