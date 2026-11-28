# D05 — wpływ ustaleń iteracji 2 na backlog v8.x

Baseline `32e360a6953d41685bc605ba2cc68e9998b2f9b8`. Snapshot zgłoszeń: Charon, 28.11.2026 ([issues-v8.md](issues-v8.md)). W tej iteracji go nie odświeżono, bo API GitHub upstream było niedostępne (GAP-012). Ten plik dopisuje **miejsce zmiany w kodzie** dla kandydatów, które da się już wskazać, i koryguje wstępne pakiety PKG-001–005.

## Werdykt
Pięć zgłoszeń ma już wskazane, ograniczone miejsce zmiany: #973, #1068/#1290, #1173, #1488 i #1394. Każde da się zrobić rozszerzeniem istniejącego kodu. Żadne nie wymaga wspólnego „silnika”. Dwa wymagają najpierw decyzji zasad (DEC-005, DEC-010). Grupy Bonus Engine i Actor Lifecycle **nie** nadają się na wspólną implementację: dotykają różnych pól o różnych źródłach prawdy (D02).

## Miejsca zmiany — zweryfikowane w kodzie
| Issue | Miejsce zmiany As-Is | Dowód | Co to znaczy dla zakresu |
| --- | --- | --- | --- |
| #973 Blood Pool 14.+ pokolenia | `_calculteMaxBlood` i `_calculteMaxBloodSpend`: 14 → 8, 15 → 6, 16 → 4 | `wod-actor-base.js:1120-1186`; wywołania PC `:401-402` i legacy `:1075-1076` | jedna tabela dla PC i legacy. Ograniczenie użycia krwi z komentarzy issue nie ma dziś reprezentacji (DEC-010) |
| #1447 bonus wartości przewagi | normalizacja nadpisuje `max` Blood Pool, Paradox, Essence Pool i Willpower 5th | FND-014, RSK-017 | zakres zależy od DEC-007. Premia do `max` wymaga zmiany normalizacji. Premia do `roll` to inny zakres (#1446) |
| #1446 bonus kości przewagi | `roll` zależy od `rollSettings` świata | FND-016, `wod-item-base.js:291-303` | określić, czy premia działa po tej decyzji |
| #1068 / #1290 Rule-of-1 per rzut | `canBotch` jest już zmienną lokalną z wyłączeniami dla `soak` i `damage`; odejmowanie jedynek wymaga `usehandleOnes && canBotch` | `roll-dice.js:341-347`, `:415-421`; ustawienie `theRollofOne` w `wod.js:97-98` | override per rzut to pole `DiceRollContainer` sprawdzane obok `canBotch`. Uwaga: dziś „brak botcha” i „jedynki nie odejmują” to **jedna** flaga. Autor #1068 je rozróżnia (DEC-005) |
| #1173 kara ran tylko dla melee/natural | `_rollDamage` stosuje karę według globalnego `usePenaltyDamage` | `dialog-weaponv2.js:642-659`; typ broni znany w `buildViewModel` (`:23`, `:78`) | warunek na typ broni w jednym miejscu. Wariant natural do potwierdzenia w danych |
| #1488 ruch addytywny | `movement_buff` to tylko mnożnik. Kilka premii **sumuje mnożniki** (×1,5 i ×2 daje ×3,5, nie ×3) | `combat-helpers.js:127-135`, `bonus-helpers.js:1539-1560` | nowy typ premii albo operator. Dotyka BonusHelper (Check/Get), obu `CalculateMovement*`, listy typów w dialogu premii. Kolejność względem form: DEC-006 |
| #1394 kolejność umiejętności | sortowanie po przetłumaczonej etykiecie; przewagi już sortują po `settings.order`, a Ability ma `settings.order` w danych | `pc-actor-sheet.js:1130-1148`; dane paku | prezentacja: użyć istniejącego `order` za ustawieniem. Bez zmiany modelu |
| #1492 Quickening | Augment Attributes działa dla każdej PC z widoczną przewagą `bloodpool`, także Ghoula i Ananasi; Kindred of the East nie ma Blood Pool | `attribute-augmentation-popup.js:55-61`, d01-capability-catalog.md | zakres ręczny już jest. Koszt krwi i limity to osobna decyzja; DEC-011 dla Ghoula i Ananasi |

## Nowe powiązania
| Relacja | Typ | Dowód |
| --- | --- | --- |
| #973 → #1447 | SHARES_DATA_MODEL / VERIFIED | oba zmieniają pojemność Blood Pool, którą normalizacja wylicza z generacji (FND-014) |
| #1173 → #843 | SHARES_COMPONENT / VERIFIED | `DialogWeaponV2._rollDamage`; kara ran i `extraSuccesses` budują tę samą pulę (`:642-665`) |
| #1068/#1290 → #1481 | SHARES_COMPONENT / INFERRED | reroll Arete musiałby powtórzyć także override jedynek; kontrakt `DiceRollContainer` |
| #941 → FND-001 | DEPENDS_ON / INFERRED | każda przemiana przez wymianę Splata wymaga najpierw działającej gałęzi wymiany |
| #827/#877/#1218 → GAP-013 | SHARES_DATA_MODEL / VERIFIED | brak Splata PC Creature/Spirit w compendium; wymagania dotyczą dwóch reprezentacji |

## Defekty bez zgłoszenia w milestone
Te ustalenia nie mają issue w v8.x. To kandydaci na zgłoszenie przez Mandora, nie na samodzielny PR.

| ID | Defekt | Dowód |
| --- | --- | --- |
| FND-001 | wymiana Splata przez upuszczenie nie działa od v6.0.0 (dwa błędy) | PROBE-001, PROBE-002 |
| FND-002 | limit umiejętności nadpisywany limitem mocy przy instalacji | `drop-helpers.js:769-770` |
| FND-003 | Savage Age poza warunkami `settings.splat` | d00-verification.md |
| FND-017 | `module/dialogs/dialog-weapon.js` i `module/scripts/import-helpers.js` nie są importowane nigdzie (martwy kod; `dialog-weapon.js` zawiera własną, nieużywaną logikę `usePenaltyDamage`) | statyczny skan importów `module/`, `wod.js`, `tests/`; brak odwołań tekstowych |

FND-017 jest ważne dla agentów AI. Wyszukiwanie `usePenaltyDamage` trafia w dwa dialogi, a tylko `dialog-weaponv2.js` jest używany. Status: VERIFIED dla importów statycznych. Ładowania przez makro użytkownika nie da się wykluczyć bez runtime.

## Korekta wstępnych pakietów Charona
| PKG | Było | Jest |
| --- | --- | --- |
| PKG-001 | naprawa `ReferenceError` | naprawa **dwóch** linii (`:569`, `:572`) + test liczący faktyczne usunięcia (RSK-010) |
| PKG-002 | override Rule-of-1 | bez zmian; doprecyzowano miejsce zmiany i konflikt pojęć „botch” i „ones cancel” |
| PKG-003 | ruch addytywny | bez zmian; dopisano semantykę sumowania mnożników |
| PKG-004 | odbiór bonuslist i removeSplat | bez zmian; removeSplat wymaga runtime (BLOCKED) |
| PKG-005 | prezentacja | #1394 ma wskazane miejsce zmiany; #1491 i #1339 bez zmian |
| PKG-006 (nowy) | — | #973: tabela generacji, po decyzji DEC-010 |
| PKG-007 (nowy) | — | #1173: warunek typu broni w `_rollDamage` |
