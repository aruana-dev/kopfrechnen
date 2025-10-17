# Sound-Dateien für Kopfrechnen-App

Legen Sie hier Ihre Sound-Dateien ab. Die App sucht automatisch nach folgenden Dateien:

## Hintergrundmusik
- `background.mp3` - Hintergrundmusik während der Lobby und des Quiz

## Sound-Effekte

### Lobby
- `waiting.mp3` - Wartemusik in der Lobby
- `join.mp3` - Sound wenn ein Teilnehmer beitritt

### Countdown & Start
- `countdown.mp3` - Sound während des Countdowns (10-9-8...)
- `start.mp3` - Sound beim Start des Quiz

### Quiz
- `tick.mp3` - Tick-Sound bei vorgegebenem Tempo
- `timeout.mp3` - Sound wenn die Zeit abläuft

### Ergebnisse
- `applause.mp3` - Applaus bei den Ergebnissen
- `winner.mp3` - Sound für den Gewinner (Platz 1)
- `celebration.mp3` - Feier-Sound am Ende

## Hinweise

- Alle Sounds sind optional - die App funktioniert auch ohne
- Unterstützte Formate: `.mp3`, `.wav`, `.ogg`
- Empfohlene Lautstärke: Mittlere Lautstärke, die App passt die Lautstärke an
- Hintergrundmusik wird auf 30% Lautstärke reduziert

## Wo Sounds verwendet werden

| Sound | Verwendet in | Wann |
|-------|-------------|------|
| `background.mp3` | Lehrer-Lobby | Beim Betreten der Lobby |
| `waiting.mp3` | Lehrer-Lobby | Während des Wartens auf Teilnehmer |
| `join.mp3` | Lehrer-Lobby | Wenn ein Teilnehmer beitritt |
| `countdown.mp3` | Alle | Während des 10-Sekunden Countdowns |
| `start.mp3` | Alle | Beim Start des Quiz |
| `tick.mp3` | Schüler-Quiz | Bei vorgegebenem Tempo |
| `timeout.mp3` | Schüler-Quiz | Wenn Zeit abläuft |
| `applause.mp3` | Ergebnisse | Beim Anzeigen der Ergebnisse |
| `winner.mp3` | Ergebnisse | Für Platz 1 |
| `celebration.mp3` | Ergebnisse | Allgemeine Feier |

Alle Sounds werden **nur auf dem Lehrer-Tab** abgespielt (außer individuelle Schüler-Sounds wie `tick.mp3` und `timeout.mp3`).

