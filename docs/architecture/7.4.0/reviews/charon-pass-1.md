# CHARON — PRZEBIEG 1: review rzetelny

**Werdykt:** poprawka usuwa dwa rzeczywiste wyjątki i przechodzi test czerwony/zielony, natomiast dokumentacja i uzasadnienie bezpieczeństwa roadmapy wymagają korekty.

## Zamrożony zakres
| Przedmiot | Potwierdzony pełny SHA |
| --- | --- |
| docs/architecture-7.4.0 | `7ed2419c3eca11b7becc53acd68a753f141df8f5` — zgodny z oczekiwanym 7ed2419 |
| fix/splat-replacement | `16c817a7c81e737cac6c855bc3e455181ea17a6a` — zgodny z oczekiwanym 16c817a |
| baza kodu v7.4.0 | `32e360a6953d41685bc605ba2cc68e9998b2f9b8` |
| baza porównania dokumentacji | `8f19211439e4d5ad3c0b0fec256ff55098f609df` |

Obie gałęzie sprawdzono przed analizą; warunek zatrzymania nie wystąpił. Zakres A to pięć commitów dokumentacyjnych 8f192114..7ed2419, 15 zmienionych plików. Zakres B to commit z rodzicem dokładnie v7.4.0: drop-helpers.js, tests/drop-splat.test.mjs i tests/README.md. Oceniane gałęzie pozostają tylko do odczytu. Raporty są jedynym zapisem wymaganym punktem 6 zlecenia, na osobnej gałęzi recenzji.

## Metoda i wykonanie
Przeczytano wszystkie zmienione dokumenty, rejestry, katalog JSON i trzy dodane skrypty. Sprawdzono zmienioną metodę, jej rzeczywistego wywołującego OnDropItem oraz importerów/Populate* i konsumentów właściwych dla twierdzeń. Wiedza z mojej poprzedniej iteracji była punktem do ponownego sprawdzenia, nie dowodem poprawności Morosa.

**Wykonano w tej recenzji, Node v22.21.1, odizolowane kopie:**
- test Morosa na kodzie v7.4.0: **2 PASS / 1 FAIL**, ReferenceError w drop-helpers.js:569;
- ten sam plik na 16c817a: **3 PASS / 0 FAIL**;
- kontrola historii: commit v6.0.0 to `fde82f1dba49d64525aa417a31f9d927b349d02b`; jego rodzic `0ca67d4a2abbc31fcbe7708316f51077dbc3c38d` nie ma DropSplatToActor;
- kontrola danych opublikowanego katalogu: 115 rekordów, suma liczebności składników 4840, 9 id spoza słownika, 46 wierszy tabeli profili;
- niezależny, tylko do odczytu odczyt binarnych paków: odczytano 33 katalogi LevelDB, w aktywnym SST Splats uzyskano 127 rekordów, w tym zgodny rozmiar 115 Itemów + 12 folderów; parser sprawdzał CRC32C rekordów/bloków i dekompresję Snappy.

**Granica liczb:** nie udało się pobrać dziennika packs/splats/000967.log (1 980 712 bajtów): odpowiedź Contents/base64 była pusta, a blob nie został udostępniony jako UTF-8. Manifest wskazuje live SST 969 oraz log 967. Nie twierdzę zatem, że odtworzyłem kompletny stan bazy z całym dziennikiem ani niezależnie udowodniłem 0 zerwanych UUID. Skrypt Morosa i metoda są dostępne, lecz jego pełny wynik pozostaje wynikiem autora; katalog podsumowujący nie zachowuje UUID każdego odwołania.

Próba dalszych kontroli terminalowych zakończyła się utratą środowiska. **Pełnych 206/209 npm test nie powtórzono w tej recenzji.** Nie uruchamiano Foundry V14, nie sprawdzono zapisu na serwerze ani UI. Analiza kodu, analiza paków i testy Node nie są testem Foundry.

## Rozstrzygnięcia T1–T10
Waga wskazuje najwyższy wpływ ustalenia/ograniczenia na odbiór; potwierdzenie twierdzenia nie oznacza zarzutu wobec autora.

| ID | Werdykt | Dowód i rozstrzygnięcie | Waga |
| --- | --- | --- | --- |
| T1 | CONFIRMED | [module/scripts/drop-helpers.js:549](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L549), :569–578; v6.0.0 ta sama metoda :486–515 ma oba defekty, rodzic jej nie zawiera. ReferenceError potwierdzony uruchomieniem; this.actor nie jest argumentem actor przy normalnym statycznym wywołaniu. Historia wspiera wprowadzenie z v6.0.0. | MAJOR |
| T2 | CONFIRMED w granicach danych/kodu; skutek INFERRED | [d00-verification.md:62](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d00-verification.md#L62), [templates/actor/parts/macro_icons.hbs:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/templates/actor/parts/macro_icons.hbs#L6), :20 i [module/scripts/combat-helpers.js:93](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/combat-helpers.js#L93). Dziewięć rekordów Savage ma wskazane id, getSplat wybiera wygląd inaczej. Autor uczciwie rozdziela dane od runtime. Brak makra dotyczy odpowiednich Garou; nie rozszerzać go na każdą Ferę, która także w modern nie spełnia warunku werewolf. | MAJOR |
| T3 | PARTIAL | [module/scripts/drop-helpers.js:1142](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L1142), :1184–1320, :1488–1557. Dla importowanego składnika istniejące źródło z compendium rzeczywiście wygrywa, a Populate przenosi określone metadane. Ale istniejący składnik aktora może spowodować wcześniejsze pominięcie importu. Ponadto GetCompendiumItem zakłada istnienie paku: brak paku nie jest tym samym co brak trafienia i nie dowodzi działającego fallbacku świat→kopia. Sformułowanie „przy każdej instalacji wygrywa compendium” jest zbyt szerokie. | MAJOR |
| T4 | PARTIAL | [checks/check-splat-references.py:7](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/checks/check-splat-references.py#L7), :13–27; [checks/dump-packs.mjs:7](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/checks/dump-packs.mjs#L7) i katalog. 115/4840 odtwarza się z katalogu jako liczba Itemów i wystąpień składników, nie liczba unikalnych UUID. Metoda rozwiązania odwołań jest podana. Niezależny odczyt całej bazy i 0 zerwanych nie został dokończony z powodu niedostępnego logu; nie zamieniam tej granicy narzędzi na zarzut fałszu wobec Morosa. | MINOR |
| T5 | PARTIAL | [module/actor/data/wod-actor-base.js:183](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L183), :257–284, :499–575; [templates/actor/parts/macro_icons.hbs:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/templates/actor/parts/macro_icons.hbs#L6). PC rzeczywiście odbudowuje określone flagi i mapy z Itemów. Nie wynika z tego niezależność całej dostępności cech/akcji od Game/Splat: makra i reguły nadal sprawdzają splat; widok i wariant sterują dodatkowymi wejściami. 46 jest liczbą wierszy autorskiego grupowania, bez zapisanego algorytmu grupowania. | MAJOR |
| T6 | REFUTED w podanej ogólnej postaci | [module/actor/data/wod-actor-base.js:286](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L286), :300–336: max Willpower jest **odczytywany**, a payload zapisuje permanent/temporary/roll, bez system.max. Blood Pool jest normalizowane tylko przy polu generation (:398–418), Paradox przy Quintessence (:425–436), Essence Pool własną funkcją (:1666–1713). Zapis jest warunkowy na różnicę. Twierdzenie FND-014/RSK-017 o nadpisywaniu max wszystkich czterech zasobów, oznaczone VERIFIED, jest nieprawdziwe. | MAJOR |
| T7 | PARTIAL | [module/actor/data/wod-actor-base.js:1120](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L1120), :398–418 i :1075–1076. Samą tabelę pojemności współdzielą PC i legacy; nie wykazano potrzeby nowego silnika. Pełne #973 obejmuje jednak odrębność dozwolonych zastosowań krwi. „Jedna funkcja” jest prawdziwe dla ograniczonego wariantu pojemności, nie dla automatycznej realizacji całego wymagania; decyzja DEC-010 pozostaje otwarta. | MAJOR |
| T8 | PARTIAL | [module/actor/data/wod-actor-base.js:31](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L31), :43, :46–67, :199, :591–593. Wywołanie async bez await i brak kontroli owner przed tym zapisem są widoczne; derived ma early return dla permission<3. Moros uczciwie oznaczył kontrakt Foundry jako INFERRED w d01:111 i widoczny efekt jako HYPOTHESIS. Nie odczytano core Foundry i nie dowiedziono żądań sieciowych z każdego klienta. Rejestr GAP-014 i podsumowania powinny zachować te kwalifikacje. | MAJOR |
| T9 | REFUTED jako uzasadnienie bezpieczeństwa | [d07-roadmap.md:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d07-roadmap.md#L6), tabela PR-001; [module/scripts/drop-helpers.js:575](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L575)–819. Błąd blokujący gałąź nie dowodzi bezpieczeństwa jej uruchomienia: za nim są usuwanie składników, import i osobny zapis aktora. Testy potwierdzają usunięcie wyjątku dla pustego Splata, anulowanie i brak poprzedniego Splata. Nie potwierdzają pełnej migracji danych ani zachowania przy błędzie po delete. | MAJOR |
| T10 | PARTIAL | [d07-roadmap.md:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d07-roadmap.md#L6)–60, [discovery-status.md:14](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/discovery-status.md#L14) i JSON phases.D07. Kierunek małych niezależnych zmian jest zasadny, lecz poziom ryzyka/odwracalności i część pytań oparto na zbyt mocnych T5/T6/T9. Niezbędna korekta założeń oraz synchronizacja rejestrów. | MAJOR |

## Commit 16c817a — ocena poprawki i testu
**Zakres diffu jest mały i adekwatny do dwóch wyjątków:** lokalne const zamiast dostępu do zmiennej przed inicjalizacją, argument actor zamiast this.actor. W kodzie produkcyjnym 3 dodane / 4 usunięte linie, bez nowego mechanizmu. Testy i README to pozostałe dwa pliki.

[tests/drop-splat.test.mjs:100](https://github.com/ThresholdOps/Foundry_WoD20/blob/16c817a7c81e737cac6c855bc3e455181ea17a6a/tests/drop-splat.test.mjs#L100)–141 rzeczywiście wywołują oryginalny DropHelper, nie jego mock. Delete modyfikuje tablicę Itemów, więc asercja usunięcia ma treść behawioralną. Test czerwony/zielony jest poprawnym dowodem dla tych wyjątków.

**Ograniczenie:** Splat ma puste abilities/advantages/features/powers (:34–54). createEmbeddedDocuments i updateEmbeddedDocuments tylko zapisują wywołania, a actor.update nie aktualizuje dokumentu (:89–96). Nie wykonano DataModel, normalizacji, walidacji ID/uprawnień, importerów rzeczywistych składników ani pełnej trwałości. Test sprawdza payload ustawień, nie odczyt zapisanego aktora. Komentarz :7 „Foundry duplicate jest JSON round trip” nie ma w tym commicie dowodu z Foundry V14; pewna jest wyłącznie zmiana strategii kopii w atrapie.

Pierwszy werdykt dla poprawki: **READY FOR FOUNDRY ACCEPTANCE**, wąsko jako naprawa wyjątków, nie jako merge-ready ani potwierdzenie T9. Do zakończenia drugiego przebiegu jest to werdykt wstępny.

## Dziewięć pytań D07
| Pytanie | Ocena |
| --- | --- |
| Q-01 | zasadne pytanie o proces maintenera, lecz nie dowód bezpieczeństwa |
| Q-02 | zasadne rozstrzygnięcie semantyki; nie utożsamiać no-botch z ignorowaniem odejmowania sukcesów |
| Q-03 | obecne sumowanie mnożników można rozstrzygnąć z kodu; pytanie dotyczy wyłącznie zamiaru i kolejności nowej premii |
| Q-04 | trade-off ustawienia vs stała polityka jest decyzją; trzeba zachować treść istniejącej rozmowy issue |
| Q-05 | zasadne dla wyboru pojemność/manualne ograniczenia vs reprezentacja wydawania; nie obiecywać jednej funkcji dla obu |
| Q-06 | przypisanie niewłaściwego pola jest widoczne w kodzie; pytanie o zamiar nie powinno blokować przygotowania dowodu custom-Splat |
| Q-07 | sugeruje potwierdzony brak działania form, podczas gdy wynik runtime ma INFERRED/NOT TESTED; warunki i hipotezę należy rozdzielić |
| Q-08 | decyzja o usunięciu nieużywanych statycznie modułów to polityka utrzymania; sam brak importu nie jest dowodem pełnej nieużywalności |
| Q-09 | pytanie o zamierzoną kwalifikację capability, nie o stan kodu; kod i wcześniejsza decyzja o bloodpool już określają obecne zachowanie |

## Znaleziska poza T1–T10
### R1-A — MAJOR: nieaktualny rejestr maszynowy
[discovery-status.md:14](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/discovery-status.md#L14) opisuje D07 DRAFT v1, lecz discovery.json phases.D07 nadal NOT_STARTED. testing.md:10 podaje TEST-005 PASS 206, JSON nadal NOT TESTED. JSON odsyła do RSK-010–017/GAP-011/013/014, ale nie dodaje tych rekordów do risks/gaps; REG-015 istnieje tylko w Markdown. Nie ma jawnego modelu wersjonowanego overlay, który rozstrzyga aktualną wartość. Nie stwierdzono duplikacji ID w poszczególnych dodanych kolekcjach; problemem jest rozbieżność i brak rekordów/relacji w ich katalogach.

### R1-B — MAJOR: scope #1447 zawężony do max mimo braku decyzji
FND-014 summary, RSK-017 oraz relacja #973→#1447 przedstawiają nadpisanie pojemności jako wspólną ustaloną semantykę. DEC-007 nadal pyta, czy chodzi o max, temporary czy roll, a T6 ma kontrprzykład Willpower i zasobów bez wymaganych rodziców. Źródła: [d02-resource-semantics.md:15](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d02-resource-semantics.md#L15), [d05-impact-update.md:26](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d05-impact-update.md#L26), [gaps-risks-decisions.md:42](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/gaps-risks-decisions.md#L42).

### R1-C — MINOR: liczniki i profile wymagają dokładniejszych definicji
206 pełnych testów autora nie zostało tu powtórzone. d00:101 mówi o 13 plikach testów bazy, podczas gdy drzewo v7.4.0 ma 12 plików *.test.mjs; trzynasty dodaje poprawka. 46 profili ma tabelę, lecz nie zapisany klucz grupowania. To nie unieważnia katalogu, ale ogranicza automatyczne odtwarzanie.

### R1-D — MAJOR: w podsumowaniu zgubiono status INFERRED platformy
d01:111 kwalifikuje kontrakt Foundry poprawnie. Natomiast GAP-014 w gaps-risks-decisions.md:19 stwierdza już, że platforma nie czeka, bez tej kwalifikacji. Nie oznaczono tego jako wykonanego testu Foundry, ale twierdzenie jest mocniejsze niż podany dowód.

## Kontrola jakości statusów
W odczytanych artefaktach nie znaleziono wpisu PASS(Foundry) utworzonego z samej analizy statycznej. T2 i FND-009–012 mają istotne jawne ograniczenia. Główna nieuczciwa precyzja to FND-014/RSK-017: VERIFIED obejmuje szerszą tezę niż kod. „INFERRED” nie uprawnia do prezentowania skutku jako faktu w Q-07.

## Zakończenie PRZEBIEGU 1
Raport utrwalany przed rozpoczęciem PRZEBIEGU 2. Wstępnie: poprawka READY FOR FOUNDRY ACCEPTANCE; roadmapa **REVISE**. Nie jest to wspólny werdykt końcowy. Drugi przebieg ma niezależnie spróbować obalić te oceny.

OUT OF SCOPE: implementacja poprawek, usuwanie modułów, projekt pełnej przemiany #941 i nowe komentarze/PR do upstream.
