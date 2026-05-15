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

## Admin-Zugang

Der Adminbereich unter `/lg-dashboard.html` ist per Login geschützt. Setze in Netlify mindestens diese Umgebungsvariable:

- `ADMIN_PASSWORD` - Passwort für den Admin-Login

Optional kann `ADMIN_SESSION_SECRET` gesetzt werden, um die Session-Cookies unabhängig vom Passwort zu signieren.

## Code-Trennung

- Öffentlicher Index-/Seiten-Code liegt unter `assets/js/public/`.
- Admin-Login und Dashboard-Code liegen unter `assets/js/admin/`.
- `config.js` enthält nur öffentliche Seitenkonfiguration; Admin-Seiten laden diese Datei nicht.

---

**Lizenz**  
*(Hier kannst du deine gewünschte Lizenz einfügen, z. B. MIT, GPL, etc.)*
