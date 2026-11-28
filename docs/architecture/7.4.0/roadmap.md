# Kolejność dalszych prac i bramki D07
To plan domknięcia rozpoznania, nie zatwierdzony projekt nowej architektury. W tej iteracji nie uruchamiano D07 jako końcowej rekomendacji implementacji: pozostają istotne luki runtime i semantyki wymagań.

| Kolejność | Zakres | Wartość / kryterium odbioru |
| --- | --- | --- |
| NEXT-001 | pełny snapshot, pełne istniejące testy i walidacja dokumentów | zamknięcie GAP-009; zachowanie już potwierdzonych 198 wyników |
| NEXT-002 | Splat: instalacja / wymiana / reset w Foundry | potwierdzenie PROBE-001 i zakresu usuwania; REG-008; bez implementacji przemiany |
| NEXT-003 | atrybut→Bonus→total→pula/soak/inicjatywa/ruch→refresh | field-level odczyty/zapisy z PC/legacy i dwiema liniami oraz capability negatywną |
| NEXT-004 | tokeny i dwa klienty | REG-003/004/007; odróżnić utrwalenie, hook i widoczny rezultat |
| NEXT-005 | rzeczywiste szablony, formy, UUID | katalog compendiów i weryfikacja custom/hybrid zamiast zakładania wsparcia |
| NEXT-006 | wymagania i brakujące reprodukcje | #1446, #1447, #1218, #1161; załączniki; rozstrzygnięcia DEC-004–DEC-010 |
| NEXT-007 | domknięcie D05 mapą konkretnych funkcji i testów | każdy kandydat ma pełną trasę, dowód brakującego zachowania i negatywne przypadki innych linii |
| NEXT-008 | D07 — ocena małych pakietów | dopiero wtedy Development Roadmap i Candidate PR Backlog do decyzji |

## Jak ocenić kandydatów D07
Każdy pakiet otrzyma: wartość dla użytkownika, pokryte issue, istniejący kod do użycia, minimalny zakres, wpływ między liniami, ryzyko, koszt testowania, zależności, odwracalność, możliwość niezależnego PR i zgodność z decyzjami maintenera. Koszt nie jest estymowany liczbowo przed domknięciem ścieżki i testów.

Pierwszym kandydatem technicznym jest odrębny błąd wymiany Splat; jego naprawienie samo nie realizuje #941. Override Rule-of-1, operator ruchu i pojedyncze zmiany prezentacji pozostają niezależnymi kandydatami. Nie ma dowodu potrzeby wspólnego refactoringu tych obszarów.

## Pytania do Johana — do późniejszej konsultacji
Znaczenie resetu/przemiany, semantyka premii Advantage, polityka jedynek per roll, kolejność premii ruchu, ponowienie kosztów przy reroll oraz zakres ochrony danych w widoczności. Dokumentuje się pytania; niczego nie wysłano ani nie utworzono PR.
