# D00 — Architecture Knowledge Inventory
Baseline `32e360a6953d41685bc605ba2cc68e9998b2f9b8`. Zakres przeszukania: znana gałąź dokumentacji forka, źródłowy README i tests/README, folder WoD20 oraz wyszukanie tytułów WoD20/Foundry architecture w dostępnych plikach. Nie jest to deklaracja przeszukania wszystkich repozytoriów i prywatnych nośników użytkownika.

| ID | Artefakt | Punkt odniesienia | Ocena i wykorzystanie |
| --- | --- | --- | --- |
| KNW-001 | Pierwsza mapa README.md tej gałęzi | 7.4.0, dokładny SHA | VERIFIED struktury; brak runtime; zachowana, rozszerzana modularnie |
| KNW-002 | inventory.json | 7.4.0, dokładny SHA | VERIFIED spisu; graf tekstowy, nie pełny graf wywołań |
| KNW-003 | README upstream | wydany commit | deklaracje i nawigacja; nie dowód działania każdej funkcji |
| KNW-004 | tests/README.md i testy | wydany commit | zakres sprawdzony; 198 wybranych testów teraz wykonano |
| KNW-005 | Notatka przemian #941 | wcześniejszy d2c8dfbf25ff5be8cc9c20d26e1f3e7249108cef | mieszanka propozycji To-Be i obserwacji; błąd gałęzi wymiany Splat ponownie odtworzony na 7.4.0 |
| KNW-006 | Audyt WP2 #1366 | 7.3.2 / a9b6050b63c989309373542377387d04765878be, 23.11.2026 | OUTDATED dla szczegółów wydania; źródło przypadków regresji, nie wynik odbioru 7.4.0 |
| KNW-007 | Prototyp #1366 v0.1, ZIP | metadane pliku, zawartość nieodczytana | UNKNOWN wersji; nie użyto do twierdzeń o As-Is |
| KNW-008 | Załączony Architecture Discovery prompt | wymagania D00–D07 | wymaganie użytkownika, nie opis rzeczywistego kodu; wykryto dwie kopie pliku o tej samej wielkości |
| KNW-009 | Issues v8.x i komentarze | aktualny odczyt 28.11.2026 | VERIFIED treści tekstowej i stanów w chwili odczytu; implementacja wymaga dowodu z kodu |
| KNW-010 | Dokumentacja Charona jako całość (commit dok. 8f19211) | kod 32e360a | VERIFIED wyrywkowo w iteracji 2: 14/14 twierdzeń, 0 CONFLICT — [d00-verification.md](d00-verification.md) |
| KNW-011 | Compendia systemu `packs/*` (LevelDB) | 32e360a | VERIFIED(data): odczyt statyczny 32 paków z manifestu; `packs/abilities` pusty i poza manifestem |

## Walidacja odziedziczonej mapy
- Tag v7.4.0 i upstream main wskazywały przy odczycie na `32e360a6953d41685bc605ba2cc68e9998b2f9b8`. To stan chwilowy; dalsze analizy nadal używają SHA.
- 125 pobranych plików: odtworzono dokładne bajty i sprawdzono SHA-1 obiektu Git względem kompletnego drzewa; 0 rozbieżności. Dotyczy to pierwotnego zbioru 105 JS, manifestów i dokumentacji/testów, nie całego archiwum wydania.
- Wcześniejszy zapis „brak potwierdzonego wyniku testów” opisuje poprzedni etap. Obecny dowód: 191 + 7 PASS. Nie przenosi to testów do Foundry.
- Odróżniono propozycję historii przemiany z KNW-005 od istniejącego DropSplatToActor/RemoveSplatFromActor.
- KNW-006 opisywał wcześniejszy problem duplikacji; wydanie ma stałe ID. Pozostający problem dwóch +1 jest opisany w publicznym wątku i zaakceptowany jako ograniczenie pierwszej wersji. To nie jest nowy odbiór dwóch klientów na 7.4.0.

## PROBE-001 — aktualizacja dowodu
Na źródłach 7.4.0 wywołano DropSplatToActor z aktorem zawierającym Splat i potwierdzeniem Dialog.confirm=yes. Wynik: ReferenceError „Cannot access 'idsToDelete' before initialization”, liczba usunięć: 0. Próba Node na atrapach, bez świata Foundry. Reproduktor: [checks/reproduce-splat-replacement.mjs](checks/reproduce-splat-replacement.mjs).

Źródła: [module/scripts/drop-helpers.js:549](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L549), [wod.js:219](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/wod.js#L219), [tests/README.md](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/tests/README.md). Luki z tej inwentaryzacji: GAP-001–GAP-008 w [rejestrze](gaps-risks-decisions.md).
