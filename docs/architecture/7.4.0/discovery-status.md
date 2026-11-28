# Discovery Status — 28 listopada 2026
Źródła: WoD20 7.4.0 `32e360a6953d41685bc605ba2cc68e9998b2f9b8`, Foundry V14. Dokumentacja bazowa przed tą iteracją: commit 3dc8b078b6e2b36e8b704bccdff216f0a7b870f2. Kod implementacji nie jest częścią zmian dokumentacyjnych.

## Stan faz
| Faza | Stan | Zakres / wyniki | Co potrzebne do odbioru |
| --- | --- | --- | --- |
| D00 Inwentaryzacja zidentyfikowanych materiałów i luk | COMPLETE (iteracja 2: zweryfikowana) | knowledge-inventory.md, d00-verification.md, gaps-risks-decisions.md. Dowody: tag/main SHA; 206/206 npm test; PROBE-001, PROBE-002; CHK-SPLAT-REF 4840/4840; 14/14 VER | zarejestrowane źródła, wersje, granice dowodu, obszary brakujące i plan uzupełnienia. Otwarte: GAP-007, GAP-012 |
| D01 Game/Era/Splat, typy, capabilities i schematy | PARTIAL (iteracja 2: rozpoznawanie capability i katalog compendium) | functional-catalog.md, d01-capability-catalog.md, catalog.json, data/splat-pack-catalog.json. Dowody: 13 Actor types; 16 Item types; 6 eras; 115 Splatów / 46 profili; 2 modele capability (legacy flagi vs PC z Itemów) | pełne powiązanie flag has* z konsumentami; import paków w Foundry. Otwarte: GAP-001 (reszta), GAP-010, GAP-011, GAP-013, GAP-014 |
| D02 Słownik semantyczny, źródła prawdy i przepływ zapisu | PARTIAL (iteracja 2: semantyka zasobów) | data-model.md, d02-resource-semantics.md, catalog.json. Dowody: DAT-001–020; SOT-001–009; katalog 15 zasobów z paku; FND-014–016 | field-level writers/consumers dla Bonus, zdrowia i soak. Otwarte: GAP-002 (reszta), GAP-004 |
| D03 Komponenty, interfejsy, rozszerzenia i Foundry | PARTIAL | components.md, discovery.json. Dowody: CMP-001–020; IF-001–014; EXT-001–007; 245 importów | pełne zależności wywołań/globali/template oraz kontrakty platformy. Otwarte: GAP-009, GAP-010, GAP-008 |
| D04 20 wymaganych scenariuszy + reset Splat | PARTIAL | execution-flows.md, discovery.json. Dowody: SCN-001–021; PROBE-001; diagram augmentacji | pełne branchy, kolejność/hooki/error i potwierdzenie istotnych scenariuszy. Otwarte: GAP-002, GAP-003, GAP-004, GAP-005 |
| D05 Pełny odczyt v8.x i pierwsza traceability | PARTIAL | issues-v8.md, discovery.json. Dowody: API page1=32,page2=0,counter=32; 23/23 komentarze; 14 typowanych relacji; 5 wstępnych pakietów | każdy brak i zakres implementacji potwierdzony trasą; brakujące wymagania doprecyzowane. Otwarte: GAP-006, GAP-002, GAP-008 |
| D06 Strategia i pierwsza rzeczywista weryfikacja | PARTIAL | testing.md, checks/reproduce-splat-replacement.mjs. Dowody: 191 logic PASS; 7 static PASS; PROBE-001 functional FAIL | odpowiedni pełny zestaw i runtime/multi-client/migracja z zapisanym dowodem. Otwarte: GAP-003, GAP-004, GAP-009 |
| D07 Końcowa Development Roadmap i Candidate PR Backlog | NOT_STARTED | roadmap.md zawiera kolejność rozpoznania, nie końcowy projekt. Dowody: wstępne PKG z D05 | ocena wartości, zakresu, kosztu testów i ryzyka każdego niezależnego kandydata po domknięciu wiedzy. Otwarte: DEC-004–010, bramki NEXT-001–007 |

Pełne rekordy faz z wejściami/wyjściami/kryteriami/dowodami są w discovery.json. COMPLETE D00 oznacza wykonanie inwentaryzacji i rejestru luk w zidentyfikowanym zakresie, nie ukończenie rozpoznania systemu ani odczyt każdego prywatnego archiwum.

## Iteracja 2 — 28 listopada 2026 (Moros)
- Zweryfikowano wyrywkowo mapę Charona: 14/14 twierdzeń potwierdzonych, bez CONFLICT.
- Pełne `npm test`: 206/206 PASS (zamyka TEST-005).
- PROBE-002: po usunięciu `ReferenceError` wymiana Splata pada na `this.actor` (FND-001, RSK-010).
- Odczytano compendia systemu z LevelDB: 115 Splatów, 4840 odwołań UUID, 0 zerwanych (FND-005, częściowo GAP-001).
- Savage Age zapisuje `settings.splat` spoza `CONFIG.splat` (FND-003, GAP-011, REG-015).
- Przy instalacji wygrywa źródło z compendium, nie kopia w Splacie (FND-004).
- D01: PC wyprowadza capability z Itemów przy każdym przygotowaniu danych, legacy ma flagi ustawiane przy tworzeniu. Katalog 115 Splatów w 46 profilach (d01-capability-catalog.md).
- FND-010–012: przygotowanie danych PC jest asynchroniczne i niezaczekane, zapisuje Itemy, a obliczenia pochodne pomija dla nie-właścicieli.
- D02: pojemność Blood Pool, Paradox, Essence Pool i Willpower (5th) jest wyliczana i zapisywana przy każdym przygotowaniu; premia do `max` nie przetrwa (FND-014, RSK-017). Ten sam `system.id` dla różnych zasobów (FND-015).
- Ograniczenie: brak dostępu do API GitHub upstream w tej sesji, snapshot v8.x nieodświeżony (GAP-012).

## Co zmieniło się względem v0.1
- Odczytano i zastosowano pełny prompt D00–D07.
- Do istniejącej mapy dodano katalogi modularne i stabilne ID, zachowując README oraz pierwotny inventory.
- Wykonano i rozdzielono 191 testów logiki, 7 kontroli statycznych oraz odtworzenie błędu zastępowania Splat.
- Wyciągnięto 6 deklarowanych modeli; 13 Actor types, 16 Item types, 6 epok, 47 kluczy wariantów i 16 kategorii Bonus.
- Pobrano cały otwarty milestone v8.x (32) i 23 komentarze, z kontrolą pustej kolejnej strony.
- Oznaczono osobno propozycje, istniejące funkcje, częściowe pokrycie i niejasne wymagania.

## Ograniczenie wykonania
Po pomyślnych próbach Node środowisko terminalowe ponownie stało się niedostępne. Zebrane wyniki pozostają ważne dla wykonanych prób. Nie ma odbioru Foundry, UI, compendiów ani wielu klientów. Trwały zapis dokumentacji jest kontynuowany przez repozytorium.

## Następny konkretny odbiór
NEXT-001/002: pełny snapshot i kontrole wydania; następnie instalacja/wymiana/reset Splat w Foundry, z kontrolą usuwanych Itemów i anulowania. Nie rozpoczynać implementacji #941 jako skutku samego istnienia resetu.
