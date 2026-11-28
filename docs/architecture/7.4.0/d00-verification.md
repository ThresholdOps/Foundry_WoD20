# D00 — weryfikacja odziedziczonej wiedzy (iteracja 2)

Data: 28 listopada 2026. Autor iteracji: Moros. Wejście: dokumentacja Charona, commit `8f19211439e4d5ad3c0b0fec256ff55098f609df` (gałąź `docs/architecture-7.4.0`). Baseline kodu bez zmian: `32e360a6953d41685bc605ba2cc68e9998b2f9b8`.

## Werdykt
Dokumentacja Charona jest **wiarygodnym punktem wyjścia**: 14 z 14 sprawdzonych wyrywkowo twierdzeń potwierdza się w kodzie lub danych. Nie znalazłem sprzeczności (CONFLICT). Znalazłem natomiast cztery rzeczy, których mapa nie zawierała, a które zmieniają zakres przyszłych PR-ów:

1. **Wymiana Splata ma dwa błędy, nie jeden** (FND-001). Po usunięciu `ReferenceError` z PROBE-001 ta sama gałąź pada na `this.actor` w metodzie statycznej. PKG-001 musi obejmować obie linie.
2. **Savage Age zapisuje `settings.splat` spoza słownika `CONFIG.worldofdarkness.splat`** (FND-003). 9 z 115 Splatów z compendium. Gałęzie kodu zależne od `splat == "werewolf"` lub `"changingbreed"` ich nie obejmują.
3. **Przy instalacji Splata wygrywa przedmiot źródłowy z compendium, nie kopia osadzona w Splacie** (FND-004). Splat w praktyce jest listą odwołań z kilkoma polami nadpisującymi.
4. **GAP-001 da się w dużej części zamknąć bez Foundry**, bo compendia są w repozytorium jako LevelDB (FND-005). Wyciągnąłem katalog 115 Splatów i sprawdziłem 4840 odwołań UUID: 0 zerwanych.

Co to znaczy: dalsze fazy mogą opierać się na mapie Charona. Pierwszy kandydat PR (naprawa wymiany Splata) jest większy, niż zakładano, a każda zmiana warunkowana nazwą linii musi uwzględniać epokę Savage Age.

## Inwentarz źródeł — uzupełnienie
| ID | Artefakt | Punkt odniesienia | Ocena |
| --- | --- | --- | --- |
| KNW-010 | Dokumentacja Charona (INDEX, D00–D06, discovery.json, catalog.json, inventory.json, checks/) | commit dok. `8f19211`, kod `32e360a` | VERIFIED wyrywkowo (tabela niżej). Zachowana bez zmian treści; ta iteracja dopisuje pliki i adnotacje |
| KNW-011 | Compendia systemu `packs/*` (LevelDB w repozytorium) | `32e360a` | VERIFIED(data). 33 katalogi, 32 w manifeście; `packs/abilities` jest pusty i nie ma go w `system.json` |
| KNW-012 | Raport Charona przekazany przez Mandora w czacie projektu | 28.11.2026 | streszczenie KNW-010; nie jest osobnym dowodem |

Lokalizacja istniejącej dokumentacji (otwarte pytanie z czatu projektu) jest rozstrzygnięta: to gałąź `docs/architecture-7.4.0` forka `ThresholdOps/Foundry_WoD20`. Innych artefaktów architektury nie znalazłem: `/mnt/project-files` był pusty, a do urządzenia Mandora nie podłączono folderów.

## Baseline — ponowne potwierdzenie
| Fakt | Wynik | Status |
| --- | --- | --- |
| Tag `v7.4.0` → commit | `32e360a6953d41685bc605ba2cc68e9998b2f9b8` (commit, nie tag adnotowany) | VERIFIED |
| `origin/main` w chwili odczytu (ok. 16:00 CET) | ten sam SHA; `git log v7.4.0..origin/main` pusty | VERIFIED, stan chwilowy |
| Gałąź dokumentacji forka | `v7.4.0` + 2 commity wyłącznie w `docs/` | VERIFIED |
| `system.json` | version 7.4.0, Foundry min/verified/max = 14 | VERIFIED |

## Wyrywkowa weryfikacja twierdzeń Charona
| ID | Twierdzenie (źródło) | Sprawdzenie | Wynik |
| --- | --- | --- | --- |
| VER-001 | Wymiana Splata rzuca `ReferenceError` (PROBE-001, RSK-001) | reproduktor uruchomiony ponownie; `drop-helpers.js:569` przypisuje do `let` zadeklarowanego w `:578` | VERIFIED (code + Node probe) |
| VER-002 | Reset usuwa wszystkie Itemy (RSK-002) | `drop-helpers.js:837-841`: `actor.items.map(i => i.id)` → `deleteEmbeddedDocuments` | VERIFIED (code) |
| VER-003 | 13 Actor types, 16 Item types | `template.json` | VERIFIED |
| VER-004 | Spirit jest w `config.sheettype`, ale nie jest typem Actor | `config.js:3-17`, `template.json`, brak rejestracji w `wod.js:216-296` | VERIFIED |
| VER-005 | DataModel tylko dla PC i 5 typów Item | `wod.js:197-203` | VERIFIED |
| VER-006 | `calculateTotals` czyta `game.actors` | `totals.js:6` | VERIFIED |
| VER-007 | DiceRoller może wydać tymczasową Willpower przed rzutem | `roll-dice.js:253`, `:323` | VERIFIED |
| VER-008 | `actor.api` tylko dla PC | `wod-actor-base.js:16` getter, `api-handler.js` | VERIFIED |
| VER-009 | jog = DEX+12, run = 3×DEX+20 | `combat-helpers.js:86-87` | VERIFIED |
| VER-010 | Era: dwa formaty i fallback `modern` | `select/era.js:5-21` | VERIFIED |
| VER-011 | Instalacja kopiuje `game/era/splat/variant/variantsheet` ze Splata | `drop-helpers.js:808-815` | VERIFIED; uzupełnienie: `splat` pochodzi z `settings.id`, nie z osobnego pola (FND-003) |
| VER-012 | Splat zawiera definicje i odwołania UUID składników (D02) | dane compendium: każdy z 4840 wpisów ma pełną kopię i `uuid` `Compendium.worldofdarkness.*` | VERIFIED; uzupełnienie o kolejność rozstrzygania (FND-004) |
| VER-013 | 191 + 7 testów PASS | pełne `npm test` | VERIFIED i rozszerzone: 206/206 PASS (TEST-005 niżej) |
| VER-014 | Lista 47 kluczy wariantów | `config.js` `wod.variant` | VERIFIED; uzupełnienie: dane compendium używają też wariantów spoza listy (FND-006) |

Nie weryfikowałem ponownie odczytu 32 zgłoszeń v8.x: w tej sesji API GitHub dla upstream jest niedostępne (GAP-012). Snapshot Charona pozostaje jedynym źródłem dla D05.

## Nowe ustalenia
### FND-001 — drugi, zamaskowany błąd wymiany Splata
- **Fakt (VERIFIED code):** `drop-helpers.js:572` wywołuje `this.actor.deleteEmbeddedDocuments(...)` w `static async DropSplatToActor(actor, droppedItem)`. W metodzie statycznej `this` to klasa `DropHelper`, która nie ma pola `actor`.
- **Dowód wykonania (VERIFIED Node probe):** PROBE-002 łata linię 569 w kopii tymczasowej i powtarza PROBE-001. Wynik: `TypeError: Cannot read properties of undefined (reading 'deleteEmbeddedDocuments')`, 0 usunięć. Reproduktor: [checks/reproduce-splat-replacement-masked.mjs](checks/reproduce-splat-replacement-masked.mjs).
- **Historia (VERIFIED git blame):** obie linie pochodzą z `fde82f1d` (v6.0.0, 12.02.2026). Gałąź wymiany nie działa więc od dziewięciu miesięcy. To wskazuje, że użytkownicy rzadko podmieniają Splat przez upuszczenie. To ostatnie jest INFERRED.
- **Konsekwencja:** poprawka PKG-001 to co najmniej dwie linie, a test musi sprawdzać liczbę faktycznie usuniętych Itemów, nie tylko brak wyjątku.

### FND-002 — `abilities.defaultmaxvalue` nadpisywane wartością dla mocy
- **Fakt (VERIFIED code):** `drop-helpers.js:770` przypisuje `actorData.system.settings.abilities.defaultmaxvalue = droppedItem.system.settings.powers.defaultmaxvalue`. Linia 769 robi to samo z wartością dla umiejętności, więc 770 ją nadpisuje. `settings.powers.defaultmaxvalue` aktora nie jest ustawiane wcale, choć model je ma (`actor_settings.js:62`) i kod je czyta (`wod-actor-base.js:381`, `:478`).
- **Zasięg (VERIFIED data):** wszystkie 115 Splatów w compendium mają 5/5/5, więc w dostarczonej zawartości efekt jest niewidoczny. Ujawni się dopiero przy własnym Splacie z różnymi limitami.
- **Status oceny:** HYPOTHESIS, że to pomyłka, a nie zamiar. Rozstrzyga maintainer. Ryzyko RSK-011 (LOW).

### FND-003 — Savage Age poza słownikiem `CONFIG.splat`
- **Fakt (VERIFIED data + code):** instalacja zapisuje `settings.splat = droppedItem.system.settings.id` (`drop-helpers.js:811`). Dziewięć Splatów z folderu „Savage Age” ma `id` spoza `CONFIG.worldofdarkness.splat`: `bilai` (Garou), `anupabael`, `apis`, `ceilican`, `grondir`, `khara`, `naghaluu`, `saksomaknami`, `wlewa`. Żadna z tych wartości nie występuje w `module/` ani `templates/`.
- **Konsumenci porównujący z nazwą linii (VERIFIED code):** makra Frenzy i Shapechange (`templates/actor/parts/macro_icons.hbs:6`, `:20`), ruch Glabro/Crinos (`combat-helpers.js:93`), klasy CSS karty (`hooks.js:110-185`), listy Breed/Auspice/Tribe (`select-helpers.js:929`), atrybuty form (`stats_attributes.hbs:34`).
- **Wniosek (INFERRED, runtime NOT TESTED):** Garou z Savage Age nie dostaje przycisku Frenzy/Shapechange ani korekty ruchu Glabro/Crinos, a jego karta nie dostaje klasy `werewolf`. Zmiana warunkowana `splat == werewolf` nie obejmie tej epoki. Typ kości w `roll-dice.js:19-20` dostanie `bilai`.
- **Konsekwencja:** Era nie jest niezależnym wymiarem od Splat. W tej epoce identyfikator Splata koduje jednocześnie linię i epokę. Do D01 i D06 wchodzi przypadek testowy „Garou Savage Age” (REG-015).

### FND-004 — przy instalacji źródło z compendium wygrywa z kopią w Splacie
- **Fakt (VERIFIED code):** `ImportAdvantage` (`drop-helpers.js:1142-1182`) i analogiczne `Import*` szukają przedmiotu najpierw w compendium po `uuid` (`GetCompendiumItem`), potem w świecie, a dopiero na końcu używają kopii osadzonej w Splacie. `Populate*` (`:1488-1540`) przenosi ze Splata tylko flagi, `order`, `itemuuid` i, dla Ability, `type` (talent/skill/knowledge).
- **Dane (VERIFIED):** wszystkie 4840 odwołań wskazuje istniejące przedmioty w pakach systemu. W 5 parach nazwa osadzona różni się od źródłowej, np. „Bloodpool” → „Bloodpool [10]”, „Rank” → „Rank [6]”.
- **Wniosek (INFERRED):** zmiana wartości składnika (np. `max` przewagi) w osadzonej kopii Splata nie ma skutku, jeśli źródło jest dostępne. Splat steruje składem i kategorią, nie wartościami. To ważne dla #973 i #1447: limitu Blood Pool nie da się ustawić per Splat przez edycję jego kopii.
- **Wydajność (INFERRED):** `GetCompendiumItem` wywołuje `compendium.getDocuments()` dla każdego składnika. Przy 30–36 umiejętnościach to dziesiątki pełnych odczytów paku na instalację. Pomiar wymaga Foundry.

### FND-005 — compendia czytelne statycznie
- **Fakt (VERIFIED):** `packs/` zawiera bazy LevelDB. Odczyt przez `classic-level` na kopii tymczasowej daje: splats 115 Itemów + 12 folderów, advantages 91, features 167, powers 17, umiejętności 35/20/22, formy Demona 21×8, aspekty i formy Exalted.
- **Narzędzia:** [checks/dump-packs.mjs](checks/dump-packs.mjs), [checks/check-splat-references.py](checks/check-splat-references.py). Katalog: [data/splat-pack-catalog.json](data/splat-pack-catalog.json).
- **Granica:** to dane źródłowe w repozytorium. Nie dowodzą, jak Foundry zaimportuje je do świata (migracja, walidacja DataModel), ani nie obejmują compendiów świata użytkownika.

### FND-006 — dwie konwencje kluczy wariantu
- **Fakt (VERIFIED data + config):** `CONFIG.variant.changingbreed` ma klucze z wielkiej litery (`Mokole`, `Bastet`). Splaty w compendium używają małych liter (`mokole`, `bastet`), a `wod-actor-base.js:1934-1978` porównuje małe litery. Klucze z wielkiej litery czyta tylko `getVariantName` w starszej karcie Changing Breed (`templates/actor/changingbreed-sheet.html:49`). Compendium używa też wariantów spoza słownika: `general`, `hsien`, `thrall`, `earthbound` (pod `demon`, a w słowniku pod `creature`).
- **Wniosek (INFERRED):** słownik `CONFIG.variant` nie jest źródłem prawdy dla PC. Jest nim zawartość Splata. Ryzyko pomyłki przy nowych porównaniach: RSK-012.

### FND-007 — PC Creature i Spirit nie mają Splata w compendium
- **Fakt (VERIFIED data):** w 115 Splatach nie ma `id` równego `creature` ani `spirit`, choć oba klucze są w `CONFIG.splat`. Creature istnieje jako starszy typ Actor; PC Creature wymaga własnego Splata.
- **Konsekwencja:** grupa „Creature Framework” z backlogu (#827, #877, #1218) dotyczy dwóch reprezentacji. #1218 trzeba najpierw przypisać do PC albo legacy (GAP-006).

### FND-008 — epoka jest zgrubna
- **Fakt (VERIFIED data):** „Werewolf [wild west]” i „Mage [sorcerers crusade]” mają `era = victorian`. Sześć kluczy epok obejmuje więc więcej ustawień, niż wskazują nazwy.
- **Konsekwencja:** funkcje ERA-SPECIFIC (np. #1257, wybór broni) widzą Wild West i Sorcerers Crusade jako epokę wiktoriańską.

### FND-009 — możliwa podmiana Itemów przez nieaktualny snapshot (HYPOTHESIS)
- **Fakt (VERIFIED code):** `DropSplatToActor` robi `foundry.utils.duplicate(actor)` w linii 638, po usunięciach i aktualizacjach Itemów, ale przed `createEmbeddedDocuments`, a na końcu `actor.update(actorData)` (`:819`). Snapshot zawiera tablicę `items` z chwili 638.
- **Hipoteza:** to, czy Foundry V14 potraktuje tę tablicę jako aktualizację osadzonych dokumentów (i nadpisze zmiany dokonane w międzyczasie), wymaga testu runtime. Ten sam wzorzec jest w `RemoveSplatFromActor` (`:847`, `:1009`) i w `:100-105`. Do REG-008.

## Testy wykonane w tej iteracji
| ID | Zakres | Wynik | Środowisko / granica |
| --- | --- | --- | --- |
| TEST-005 | pełne `npm test` (13 plików, w tym cały `release.test.mjs`) | PASS — 206/206, 0 fail/skip | Node v22.23.5, atrapy Foundry; nie jest testem runtime |
| PROBE-001 (ponownie) | wymiana Splata | FAIL funkcjonalny, odtworzony: `ReferenceError`, 0 usunięć | Node fixture |
| PROBE-002 | wymiana Splata po usunięciu `ReferenceError` | FAIL funkcjonalny: `TypeError` na `this.actor`, 0 usunięć | Node fixture na łatanej kopii tymczasowej |
| CHK-SPLAT-REF | odwołania UUID Splat → składniki | PASS — 4840/4840 rozwiązanych, 0 zerwanych | analiza danych; nie runtime |

TEST-006 i TEST-007 (Foundry, dwa klienty) pozostają BLOCKED: brak instancji Foundry w tej sesji.

## Zmiany statusu luk
| ID | Było | Jest | Uzasadnienie |
| --- | --- | --- | --- |
| GAP-001 | otwarta | **częściowo zamknięta** | zawartość Splatów, form i odwołań w pakach systemu odczytana statycznie (FND-005). Otwarte: import do świata, compendia świata, zawartość features/powers poza Splatami |
| GAP-009 | otwarta | **częściowo zamknięta** | pełne `npm test` PASS. Otwarte: walidacja Mermaid, graf partiali |
| GAP-011 | — | nowa | Savage Age i inne `settings.id` spoza słownika: pełna lista konsumentów i decyzja, czy to zamierzone |
| GAP-012 | — | nowa | brak odświeżenia snapshotu v8.x w tej iteracji (API GitHub niedostępne w sesji) |
| GAP-013 | — | nowa | brak danych Splat dla PC Creature/Spirit; nie wiadomo, jak użytkownicy je budują |

Szczegóły i ryzyka RSK-010–RSK-013: [rejestr](gaps-risks-decisions.md).

## Plan uzupełnienia (kolejność)
1. **D01:** domknąć katalog na danych z compendium: macierz Splat × capability (has*, grupy przewag, formy) i lista konsumentów warunków `splat/game/variant/variantsheet` (GAP-010, GAP-011).
2. **D02/D03:** field → writer → consumer dla ścieżki atrybut → total → pule/soak/ruch oraz instalacji Splata (GAP-002).
3. **D05:** odświeżyć snapshot v8.x, gdy dostęp będzie dostępny, i dopisać wpływ FND-001/003/004 na #941, #1466, #973, #1447.
4. **D07:** pierwszy pakiet ocenić dopiero po 1–3. Kandydat techniczny PKG-001 ma już pełny dowód.
