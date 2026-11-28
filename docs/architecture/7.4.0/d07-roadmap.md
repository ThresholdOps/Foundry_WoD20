# D07 — Development Roadmap i Candidate PR Backlog (wersja 1)

Baseline `32e360a6953d41685bc605ba2cc68e9998b2f9b8`. Wejście: D00–D05 (Charon i iteracja 2). To **propozycja do decyzji Mandora**. Nic nie zostało zgłoszone ani wysłane upstream, nie powstał też żaden PR.

## Werdykt
**Zacznij od PR-001** (naprawa wymiany Splata). To jedyny kandydat, który ma pełny dowód defektu i jest mały. Jest niezależny od decyzji zasad i nie zmienia zachowania żadnej działającej ścieżki. Następne trzy kandydaty (PR-002, PR-004, PR-006) są małe i niezależne, ale każdy czeka na jedną odpowiedź Johana. Ich koszt to głównie testy i ręczny odbiór w Foundry, nie kod.

Czego nie robić teraz: #941 (przemiana), #1447/#1446 (premie przewag), grupa Visibility i Creature Framework. Każda z nich wymaga najpierw decyzji semantycznej (DEC-004, DEC-007, DEC-008, GAP-013), a nie kodu.

## Ograniczenie wspólne dla wszystkich kandydatów
Testy runtime Foundry są w tej sesji BLOCKED. Każdy PR może mieć test Node (zestaw `tests/` i atrapy Foundry), ale **wymaga ręcznego odbioru w Foundry V14** przez Mandora albo maintenera. Koszt testowania niżej obejmuje ten odbiór.

## Candidate PR Backlog
Skala: S = do ~20 linii kodu + test; M = kilka plików; L = nowy mechanizm. Ryzyko dotyczy regresji w innych liniach.

| ID | Zakres | Issue | Wartość | Kod do użycia | Rozmiar | Wpływ na linie | Ryzyko | Koszt testów | Zależność / decyzja | Odwracalność |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **PR-001** | `drop-helpers.js:569` deklaracja `idsToDelete`, `:572` `actor` zamiast `this.actor`; test Node wymiany Splata | brak (kontekst #941, #1466) | wysoka: przywraca martwą od v6.0.0 ścieżkę | istniejący reproduktor PROBE-001/002 jako test | S | wszystkie PC z Splatem | niskie: gałąź dziś zawsze pada | Node + Foundry: wymiana Vampire → Werewolf, anulowanie, własne Itemy | czy Johan chce zgłoszenia przed PR (Q-01) | pełna |
| **PR-002** | pole `ignoreOnes` w `DiceRollContainer`, sprawdzane obok `canBotch`; checkbox w `DialogGeneralRoll` | #1068, #1290 | średnia: dwa zgłoszenia | `canBotch`, ustawienia jedynek | S–M | GENERIC; domyślnie wyłączone | niskie | Node `dice-roll.test.mjs` + ręcznie dialog | DEC-005: czy override wyłącza botch, odejmowanie jedynek, czy oba (Q-02) | pełna |
| **PR-003** | nowy typ premii ruchu addytywnej obok `movement_buff` | #1488 | średnia | wzorzec Check/Get w `BonusHelper` | M | PC i legacy (`CalculateMovement` + `v2`), formy Garou | średnie: kolejność względem form i mnożników | Node `bonus-helpers`/`combat-helpers` + formy | DEC-006: kolejność, sumowanie mnożników (Q-03) | pełna |
| **PR-004** | kara ran w `_rollDamage` tylko dla broni innych niż `Ranged Weapon` | #1173 | średnia | `buildViewModel` zna typ broni | S | GENERIC (walka) | niskie | Node + ręcznie melee/natural/ranged, Spirit | potwierdzenie podziału z komentarzy; czy jako nowe ustawienie (Q-04) | pełna |
| **PR-005** | kolejność umiejętności według `settings.order` za ustawieniem | #1394 | niska–średnia | sortowanie przewag po `order` | S–M | PRESENTATION; PC | niskie | ręcznie karta, języki | domyślność i zakres ustawienia: świat, klient czy aktor | pełna |
| **PR-006** | tabela `_calculteMaxBlood`/`Spend` dla 14.–16. pokolenia | #973 | średnia: zasady Vampire | istniejąca tabela | S | Vampire PC i legacy | niskie | Node tabeli + ręcznie karta wampira | DEC-010: 10 punktów i jak wyrazić ograniczone użycie (Q-05) | pełna |
| **PR-007** | jedna linia `drop-helpers.js:770` (`powers.defaultmaxvalue`) | brak | niska dziś (utajone) | — | S | PC z własnym Splatem | niskie | Node instalacji | czy to pomyłka (Q-06) | pełna |
| **PR-008** | Savage Age: rozpoznanie linii w regułach specjalnych | brak | średnia dla Savage Age | `getSplat`/`variantsheet` | M | Werewolf, Fera (Savage) | średnie: zmiana danych paku albo warunków + migracja aktorów | REG-015 | czy `settings.id` ma kodować epokę (Q-07) | dane: wymaga migracji |

## Kolejność
1. **PR-001.** Nie zależy od decyzji zasad. Zgłoszenie defektu, jeśli Johan go chce (Q-01).
2. **Pytania Q-02–Q-07 do Johana w jednej wiadomości**, bo każde odblokowuje osobny, mały PR.
3. Po odpowiedziach: PR-002, PR-004, PR-006 (S, niezależne), potem PR-003 i PR-005.
4. PR-007 i PR-008 tylko po potwierdzeniu, że to defekty.
5. Duże tematy (#941, #1447/#1446, Visibility, Creature) dopiero po decyzjach DEC-004, DEC-007, DEC-008 i domknięciu GAP-013. Dla każdego najpierw krótki dokument As-Is → To-Be, nie kod.

## Pytania do Johana (do wysłania przez Mandora)
| ID | Pytanie | Odblokowuje |
| --- | --- | --- |
| Q-01 | Wymiana Splata przez upuszczenie pada od v6.0.0 (dwa błędy w `DropSplatToActor`). Czy wolisz najpierw zgłoszenie, czy od razu mały PR z testem? | PR-001 |
| Q-02 | Override Rule-of-1 per rzut: czy ma wyłączać botch, odejmowanie jedynek, czy oba? Dziś jedna flaga `canBotch` steruje obydwoma | PR-002 |
| Q-03 | Ruch: czy kilka mnożników ma się sumować (dziś ×1,5 + ×2 = ×3,5)? Gdzie premia addytywna względem form i mnożników? | PR-003 |
| Q-04 | #1173: wystarczy „ranged bez kary, melee/natural z karą”, czy potrzebne osobne ustawienie? | PR-004 |
| Q-05 | #973: 14.–16. pokolenie dostaje 10 punktów? Czy ograniczenie użycia ma być widoczne w systemie, czy zostaje po stronie graczy? | PR-006 |
| Q-06 | `drop-helpers.js:770` ustawia limit umiejętności z limitu mocy. Pomyłka? | PR-007 |
| Q-07 | Savage Age ma `settings.id` `bilai`, `apis` itd. zamiast `werewolf`/`changingbreed`, więc makra Frenzy/Shapechange i formy nie działają. Zamierzone? | PR-008 |
| Q-08 | Czy `dialog-weapon.js` i `import-helpers.js` są do usunięcia, czy zostają celowo? | porządek, bez PR teraz |
| Q-09 | Czy Augment Attributes ma działać dla Ghoula i Ananasi? | DEC-011 |

## Architecture Decision Register — dopisane
| ID | Stan | Decyzja |
| --- | --- | --- |
| DEC-012 PROPOSED | Pierwszy PR to PR-001; kolejne po jednym zgłoszeniu i jednej decyzji, bez łączenia pakietów | wynik D07 v1; zatwierdza Mandor |
| DEC-013 PROPOSED | Każdy PR dotykający warunku linii ma test PC z capability, bez capability i Savage Age | RSK-012, REG-015 |
| DEC-014 PROPOSED | Zmiany pojemności zasobów (#973, #1447) idą przez funkcje normalizujące, nie przez pole `max` | FND-014, RSK-017 |

## Utrzymanie mapy
Bez zmian względem [maintaining.md](maintaining.md). Iteracja 2 dodaje dwa skrypty automatyzowalne przy nowej wersji: `checks/dump-packs.mjs` + `checks/check-splat-references.py` (zawartość i integralność compendium) oraz `checks/reproduce-splat-replacement*.mjs`. Reproduktory po naprawie zamieniają się w testy oczekiwanego wyniku.
