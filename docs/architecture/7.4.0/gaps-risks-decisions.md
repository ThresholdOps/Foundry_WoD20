# Knowledge Gaps, Architecture Risks i Decisions
Identyfikatory są stabilne. Status wiedzy nie jest statusem realizacji ani testu.

## Knowledge Gaps
| ID | Luka / fazy | Dlaczego pozostaje otwarta | Warunek zamknięcia |
| --- | --- | --- | --- |
| GAP-001 Rzeczywiste Splat/Form/UUID w compendiach / D01, D02 | Manifest i nazwy pakietów nie certyfikują zawartości | Odczytać bazę przez Foundry lub wiarygodny eksport; powiązać z konkretnym SHA |
| GAP-002 Pełne read/write i wszystkie branchy wartości wynikowych / D02, D03, D04 | Słownik schematów i główna macierz są gotowe; to nie pełny graf wywołań | Dokończyć field→writer→consumer→refresh i warunki modelu |
| GAP-003 Wykonanie Foundry V14 / D04, D06 | Node PASS nie potwierdza modelu ani UI | Wykonać REG-001–REG-014 na instancji testowej |
| GAP-004 Unlinked token i wiele klientów / D02, D04, D06 | game.actors lookup i lokalne kolejki mogą zmieniać wynik | Osobne próby linked/unlinked i A/B z obserwacją żądań |
| GAP-005 Widoczność versus dostęp do danych klienta / D03, D04, D05 | Bio helper dotyczy prezentacji; brak dowodu redakcji transportu | Zmierzyć dane dostępne Limited/Observer poza DOM |
| GAP-006 Niepełne wymagania i obrazy issue / D05 | Brak pełnego zakresu #1446/#1447/#1161, brak reprodukcji #1218; obrazów nie analizowano | Doprecyzować zakres; przejrzeć załączniki przed projektem |
| GAP-007 Historyczny prototyp i dawne próby runtime / D00, D06 | ZIP i wcześniejsze wyniki nie są dowodem aktualnego wydania | Zachować jako historyczne; porównać dopiero gdy potrzebne do regresji |
| GAP-008 Różnice platform V14/V15 / D03, D05, D07 | v8.x deklaruje Foundry v15, baseline to V14 | Osobno zbudować platform delta; nie zmieniać referencji 7.4.0 |
| GAP-009 Pełne testy release oraz graf include/partial / D03, D06 | Wybrane 7 kontroli nie obejmuje wszystkich zasobów | Pobrać pełny snapshot i wykonać pełne npm test oraz walidację Mermaid |
| GAP-010 Szczegółowe dowody zakresu każdego komponentu dla każdej linii / D01, D03 | Warunki są rozproszone; główne ścieżki to nie cała implementacja | Powiązać warunki has*/id/variant z konsumentami i testami |
| GAP-011 `settings.splat` spoza słownika (Savage Age) / D01, D03, D06 | 9 Splatów z compendium ma `id` spoza `CONFIG.splat`; konsumenci porównują z nazwą linii (FND-003) | Pełna lista konsumentów `splat`/`game`; decyzja maintenera, czy epoka ma być kodowana w `id`; REG-015 |
| GAP-012 Aktualność snapshotu v8.x / D05 | Iteracja 2 nie miała dostępu do API GitHub upstream | Ponowny odczyt stron milestone i komentarzy; porównanie `updated_at` z discovery.json |
| GAP-013 PC Creature / Spirit bez Splata w compendium / D01, D05 | Klucze są w `CONFIG.splat`, w pakach brak definicji (FND-007) | Ustalić z użytkownikami/maintenerem, jak budowane są takie postacie; przypisać #1218 do PC albo legacy |

**Adnotacje iteracji 2 (28.11.2026):** GAP-001 częściowo zamknięta: paki systemu odczytane statycznie, 4840/4840 odwołań UUID rozwiązanych ([d00-verification.md](d00-verification.md), FND-005). GAP-009 częściowo zamknięta: pełne `npm test` 206/206 PASS; walidacja Mermaid nadal otwarta.

## Architecture Risk Register
| ID | Waga / stan wiedzy | Ryzyko | Dowód i dalszy krok |
| --- | --- | --- | --- |
| RSK-001 HIGH / VERIFIED | Wymiana istniejącego Splat rzuca ReferenceError | PROBE-001; DropSplatToActor. Mała odrębna naprawa po decyzji o implementacji; potwierdzić w Foundry |
| RSK-002 HIGH / VERIFIED | Reset usuwa także Itemy niewyróżnione jako składniki Splata | RemoveSplatFromActor: map wszystkich Itemów i delete. Uzgodnić reset versus zachowanie dorobku; nie używać jako gotowej przemiany |
| RSK-003 HIGH / HYPOTHESIS | Kolejność zapisu total i przygotowania ruchu/UI może dawać niespójny widok | Wiele wejść aktualizacji, osobny persistTotals i prepareDerivedData. REG-001, aktywna zakładka Combat i ponowne otwarcie |
| RSK-004 MEDIUM / VERIFIED | Dwa przyjęte +1 mogą zredukować się do jednego wyniku | Publiczny wątek #1366 opisuje zaakceptowane ograniczenie; kolejka lokalna w kodzie. Nie wnioskować o globalnym locku; bieżące dwa klienty do ponownego odbioru |
| RSK-005 MEDIUM / VERIFIED | Era krótka i zlokalizowana; schemat domyślny różny od importu | select/era.js i DataModel settings. Używać istniejącego resolvera; przetestować oba formaty |
| RSK-006 HIGH / INFERRED | Utożsamienie premii puli, wartości i pojemności rozszerza wpływ zmiany | BonusHelper; Advantage fields; #1446/#1447/#973. Jawny kontrakt pola i odbiorców przed PR |
| RSK-007 MEDIUM / HYPOTHESIS | game.actors lookup może użyć innego źródła niż tokenowy snapshot | Totals i obliczenia Item odczytują kolekcję aktorów. REG-003/004 i unlinked token, bez domyślnej oceny wyniku |
| RSK-008 HIGH / UNKNOWN | Ukrywanie interfejsu może nie spełniać oczekiwania poufności #1240/#1352 | Helper Bio i role nie są dowodem kontraktu transportowego. Rozstrzygnąć wymaganie i wykonać REG-009 |
| RSK-009 MEDIUM / INFERRED | Wynik atrapy Node może być przeniesiony na Foundry bez dowodu | tests/README i ograniczenia tej sesji. Status wykonywania i status wiedzy muszą być oddzielne |
| RSK-010 HIGH / VERIFIED | Naprawa RSK-001 samego `ReferenceError` ujawni kolejny wyjątek na `this.actor` | PROBE-002, `drop-helpers.js:572`. PKG-001 obejmuje obie linie; test liczy faktyczne usunięcia |
| RSK-011 LOW / VERIFIED (code), HYPOTHESIS (intencja) | `abilities.defaultmaxvalue` nadpisywane limitem mocy; `powers.defaultmaxvalue` nieustawiane | `drop-helpers.js:770`. Dziś niewidoczne (115 × 5/5/5); własne Splaty z innymi limitami |
| RSK-012 MEDIUM / INFERRED | Warunki `splat == <linia>` pomijają Savage Age i inne `id` spoza słownika | FND-003, FND-006. Każda zmiana warunkowana linią testowana także na Garou Savage Age (REG-015) |
| RSK-013 MEDIUM / HYPOTHESIS | `actor.update(duplicate(actor))` z nieaktualną tablicą `items` może nadpisać zmiany Itemów | FND-009, `drop-helpers.js:638/819`, `:847/1009`. REG-008 z obserwacją Itemów po instalacji |

## Architecture Decision Register
ACCEPTED dotyczy ustaleń tego zadania. OPEN nie jest decyzją maintenera.
| ID | Stan | Decyzja / pytanie | Podstawa i konsekwencja |
| --- | --- | --- | --- |
| DEC-001 ACCEPTED | Baseline 7.4.0 przypięty do SHA; main jest tylko kontrolą aktualności | polecenie użytkownika i potwierdzony tag. Nie mieszać bieżącego main z referencją analizy |
| DEC-002 ACCEPTED | Cross-splat i PC/legacy są osobnymi wymiarami odbioru | prompt użytkownika i kod rejestracji. Funkcja specyficzna nie musi pojawiać się wszędzie; testować brak capability |
| DEC-003 ACCEPTED | Prace dokumentacyjne na oddzielnej gałęzi forka; bez upstream, komentarzy i PR | prompt użytkownika. Nie wprowadzać kodu implementacji |
| DEC-004 OPEN | Znaczenie usuwania Splat: pusty reset czy odtworzenie śmiertelnika | #1466/#1311/#941 i aktualny reset. Decyzja o zachowaniu danych poprzedza projekt przemiany |
| DEC-005 OPEN | Kontrakt Rule-of-1 override i rozróżnienie no-botch | #1290/#1068. Uzgodnić wszystkie dialogi i domyślne ustawienie |
| DEC-006 OPEN | Operator i kolejność additive/multiplicative movement | #1488. Uzgodnić formy i kumulację premii |
| DEC-007 OPEN | Co oznacza bonus wartości Advantage | #1447 bez treści. permanent, temporary, max i roll nie są zamienne |
| DEC-008 OPEN | Widoczność: prezentacja czy ograniczenie dostępnych danych | #1240/#1352; częściowo #1506. Zgodność z kontraktami Foundry wymaga weryfikacji |
| DEC-009 OPEN | Reroll: opcje historyczne kontra aktualne dane i ponawianie kosztu | #1481; DiceRoller wydaje Willpower. Nie ponawiać skutków ubocznych bez ustalenia semantyki |
| DEC-010 OPEN | Wysokie pokolenia: pojemność krwi kontra jej dozwolone zastosowania | #973. Nie sprowadzać do arbitralnego max ani do uniwersalnego resource engine |

Jawnych sprzeczności źródeł nie należy dopowiadać. Wersja historyczna „WP2 bez fixed ID” i obecny kod fixed ID oznaczają zmianę w czasie, nie CONFLICT. Otwarte issue #1366 i potwierdzenie wydania funkcji są różnymi informacjami o stanie; nie dowodzą automatycznie kompletności ani braku implementacji.
