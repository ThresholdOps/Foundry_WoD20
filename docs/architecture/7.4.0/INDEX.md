# WoD20 7.4.0 — Architecture Discovery
Punkt odniesienia: `32e360a6953d41685bc605ba2cc68e9998b2f9b8` / Foundry V14. Odczyt backlogu: 28 listopada 2026. Dokumentacja rozwijana iteracyjnie; status odbioru w [Discovery Status](discovery-status.md).

## Nawigacja
| Artefakt | Zastosowanie |
| --- | --- |
| [D00 — inwentaryzacja wiedzy](knowledge-inventory.md) | co odziedziczono, co zweryfikowano i co jest historyczne |
| [D00 — weryfikacja, iteracja 2](d00-verification.md) | sprawdzenie mapy Charona, compendia, FND-001–009 |
| [Katalog Splatów z compendium](data/splat-pack-catalog.json) | 115 Splatów: game/era/variant, przewagi, formy, moce |
| [Katalog funkcjonalny](functional-catalog.md) | Game, Era, Splat, typy i capabilities |
| [Model danych i źródła prawdy](data-model.md) | semantyka pól, zapis i odbiorcy wartości |
| [Katalog komponentów](components.md) | odpowiedzialności, interfejsy i Foundry |
| [Przepływy wykonania](execution-flows.md) | 20 scenariuszy; od działania do rezultatu |
| [Backlog v8.x](issues-v8.md) | 32 zgłoszenia i typowane powiązania |
| [Strategia i wyniki testów](testing.md) | 198 istniejących testów PASS, runtime osobno |
| [Luki, ryzyka i decyzje](gaps-risks-decisions.md) | otwarte sprawy ze stabilnymi ID |
| [Kolejność dalszego rozpoznania](roadmap.md) | bramki przed rekomendacją implementacji |
| [Utrzymanie mapy](maintaining.md) | aktualizacja wersji i sprawdzanie nieaktualności |
| [Dane dla agentów](discovery.json) | komponenty, twierdzenia, zgłoszenia i relacje |
| [Schematy danych](catalog.json) | wynik odczytu defineSchema przy atrapach opisujących pola |
| [Inwentarz źródeł i importów](inventory.json) | pierwotny snapshot 688 plików, 245 krawędzi |
| [Pierwsza mapa v0.1](README.md) | wcześniejszy widok ogólny, zachowany jako punkt wyjścia |

## Jak czytać statusy
VERIFIED oznacza dowód określonego rodzaju, wskazany obok twierdzenia: kod, konfigurację albo wykonany test. VERIFIED(code) nie jest PASS(runtime). INFERRED to wniosek, HYPOTHESIS to hipoteza, UNKNOWN to luka, OUTDATED dotyczy starszej wersji, CONFLICT oznacza sprzeczność źródeł.
Statusy testów: PASS, FAIL, N/A, NOT TESTED, BLOCKED. Stan fazy nie wynika z liczby utworzonych plików.

## Najważniejsze ustalenia
- Dwie czynne ścieżki PC/legacy wymagają osobnego śledzenia reprezentacji i zapisów.
- Zasób/capability, typ aktora, Game, Era, Splat i prezentacja nie są jednym wymiarem.
- Usuwanie Splata to szeroki reset; nie jest zachowującą historię przemianą postaci.
- Premia atrybutu, premia puli, stała wartość, trudność i dodatkowe sukcesy mają odrębnych odbiorców.
- 191 testów logiki + 7 wybranych kontroli wydania przeszło na Node v22.21.1. Pełny npm test i Foundry nie zostały odebrane.
- Pobranie v8.x: 32 zgłoszenia na stronie 1 API przy per_page=100, strona 2 pusta; odczytano 23 komentarze we wszystkich 13 niepustych wątkach. Załączniki graficzne nie zostały przeanalizowane.
