# JSONBin Index-BIN Setup für Railway

## Problem
Die JSONBin API erlaubt es nicht, alle BINs aufzulisten (404-Fehler bei `/b` Endpunkt).
Daher wird bei jedem Deploy eine neue Index-BIN erstellt, was zu Duplikaten führt.

## Lösung: Umgebungsvariable setzen

### Schritt 1: Index-BIN-ID finden

Schaue in den Railway-Logs nach dieser Zeile:
```
✅ Neuer Index-Bin erstellt: 67abc123def456...
```

Oder gehe zu [JSONBin.io](https://jsonbin.io) und suche nach der neuesten BIN mit dem Namen `kopfrechnen_index_v2`.

### Schritt 2: Umgebungsvariable auf Railway setzen

1. Gehe zu deinem Railway-Projekt
2. Klicke auf **Variables**
3. Füge eine neue Variable hinzu:
   - **Name**: `JSONBIN_INDEX_BIN_ID`
   - **Wert**: Die BIN-ID (z.B. `67abc123def456...`)
4. Klicke auf **Add** und **Deploy**

### Schritt 3: Alte Index-BINs löschen

1. Gehe zu [JSONBin.io](https://jsonbin.io)
2. Lösche alle alten `kopfrechnen_index_v2` BINs **außer der neuesten**
3. Behalte nur die BIN, deren ID du als Umgebungsvariable gesetzt hast

## Ergebnis

✅ Die Index-BIN wird immer wiederverwendet
✅ Keine Duplikate mehr
✅ Schnellerer Start (kein Suchen nach BINs)

## Überprüfung

Nach dem nächsten Deploy solltest du in den Logs sehen:
```
🌍 Verwende Index-Bin-ID aus Umgebungsvariable: 67abc123def456...
```

Statt:
```
➕ Erstelle neuen Index-Bin...
```

