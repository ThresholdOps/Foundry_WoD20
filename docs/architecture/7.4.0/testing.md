# D06 — testy, macierz regresji i dowody
## Wykonane
| ID | Zakres | Wynik | Ograniczenie |
| --- | --- | --- | --- |
| TEST-001 | 11 istniejących plików logiki | PASS — 191 testów, 0 fail/cancelled/skipped | Node v22.21.1, atrapy Foundry |
| TEST-002 | wybrane kontrole release.test.mjs | PASS — 7 testów, 0 fail/cancelled/skipped | niepełny zestaw kontroli wydania |
| TEST-003 | 125 lokalnych plików względem hashy blobów Git | PASS — 0 rozbieżności | pierwotny snapshot, nie całe archiwum |
| PROBE-001 | zastąpienie istniejącego Splat po zgodzie | FAIL funkcjonalny: ReferenceError, 0 delete | błąd odtworzony w Node; bez UI |
| TEST-004 | ekstrakcja defineSchema sześciu modeli | PASS wykonania ekstraktora | deskryptory pól, nie walidacja Foundry |
| TEST-005 | pełne npm test | NOT TESTED | nie pobrano całych templates/lang/styles/packs |
| TEST-006 | Foundry V14 / oba typy kart | BLOCKED | brak dostępnej instancji w tej sesji; środowisko wykonawcze ponownie niedostępne |
| TEST-007 | dwa klienty i aktorzy tokenowi | BLOCKED | brak bieżącej próby runtime |
| TEST-008 | prywatny prototyp ZIP | NOT TESTED | nie użyto jako źródła aktualnego działania |

TEST-001 obejmuje attribute-augmentation-helpers, attribute-augmentation-popup, bio-visibility, bonus-helpers, combat-helpers, dialog-generalroll, dice-roll, health, migration-version, spirit-weapon-pools i totals. TEST-002 obejmuje: wymagane pola system.json, typy template.json, zgodność wersji package/manifest, URL wydania, parsowanie modułów, cele względnych importów i znane cykle. Nie sumować „błąd odtworzony” jako dodatkowego poprawnego scenariusza użytkownika.

## Polecenia odtworzenia
W katalogu kodu odpowiadającym SHA `32e360a6953d41685bc605ba2cc68e9998b2f9b8`:
```sh
node --test tests/attribute-augmentation-helpers.test.mjs tests/attribute-augmentation-popup.test.mjs tests/bio-visibility.test.mjs tests/bonus-helpers.test.mjs tests/combat-helpers.test.mjs tests/dialog-generalroll.test.mjs tests/dice-roll.test.mjs tests/health.test.mjs tests/migration-version.test.mjs tests/spirit-weapon-pools.test.mjs tests/totals.test.mjs

node --test --test-name-pattern='every module script parses|relative imports point|module scripts do not import|system.json has|template.json parses|same version|version' tests/release.test.mjs

node docs/architecture/7.4.0/checks/extract-catalog.mjs
node docs/architecture/7.4.0/checks/reproduce-splat-replacement.mjs
```

Ostatni reproduktor kończy się sukcesem technicznym, jeżeli odtworzy oczekiwany błąd. To nadal FAIL funkcjonalności zastępowania, nie PASS działania systemu. Po poprawce reproduktor należy zastąpić testem oczekiwanego poprawnego rezultatu.

## Regression Test Matrix — wymagane kombinacje runtime
Wszystkie poniższe pozycje mają status NOT TESTED; dostęp do środowiska jest ich obecną blokadą.
| ID | Scenariusze | Warianty i oczekiwany wynik |
| --- | --- | --- |
| REG-001 | SCN-003/004/005/016/017 | baza→Bonus→total→pula/soak/inicjatywa/ruch; aktywacja i cofnięcie bez przeładowania |
| REG-002 | SCN-006 | PC z bloodpool i bez niego; właściciel/GM/Observer; earthbound; trzy stałe Itemy; reset zachowuje ID |
| REG-003 | SCN-018 | dwa okna tego samego GM, GM+właściciel; kolizja pierwszego tworzenia; dwa +1; jawny zapis oczekiwanego ograniczenia |
| REG-004 | SCN-007/016 | Werewolf, Fera i custom forms; formy bazowe, skrajne wartości i pancerz |
| REG-005 | SCN-014/015 | mortal zwykłe zdrowie, Changeling dwa tory, Wraith Corpus, duch; brak przecieku wartości między torami |
| REG-006 | SCN-008/009/010 | Willpower/permanent/temporary, brak zasobu, Arete/Lore/standard; rzut bez aktora |
| REG-007 | SCN-011/012/013 | melee/natural/ranged, spirit Rage/Willpower, extraSuccesses, wound penalty; brak duplikatu Combatant |
| REG-008 | SCN-002/021 | czysty PC; obecny Splat; custom definicja; anulowanie; własne Itemy i notatki; awaria po częściowym zapisie |
| REG-009 | SCN-019 | GM/owner/Observer/Limited; Bio, pola custom, puste HTML, portret i metadane rodzaju postaci |
| REG-010 | SCN-020 | kopie światów PC/legacy; stare Bonusy; brakujące pola; embedded/world Item; compendia świata |
| REG-011 | SCN-017 | AppV1/AppV2, języki, motywy, zamknięty popup, widoczna zakładka Combat, długie specjalizacje |
| REG-012 | CAP-004/CAP-011 | hybryda Mage+Ghoul, custom Ability i custom Splat; dodatnia capability i jej brak |
| REG-013 | CAP-008 | wszystkie 6 kluczy epok oraz krótkie/pełne wartości; poprawny fallback i brak zmiany zapisanej semantyki |
| REG-014 | wszystkie wspólne ścieżki | PC dla każdej wykrytej rodziny i reprezentatywne legacy; zakres rozszerzać według warunków, nie tylko etykiet |

## Strategia warstw
Unit sprawdza obliczenia i kategorie. Integracja powinna łączyć realne funkcje reguł z reprezentatywnymi modelami; atrapy nie mogą udawać gwarancji serwera. Runtime potwierdza modele, uprawnienia, hooki i kolejność. UI potwierdza widoczny wynik po renderze. Migracja korzysta wyłącznie z kopii świata. Multi-client mierzy oba żądania, wynik zapisu i odświeżenie. Cross-splat łączy warianty posiadające capability z przypadkiem, który jej nie ma.
Nie przypisywać N/A tylko na podstawie Game; musi wynikać z braku właściwej capability albo konkretnego kontraktu.

Definicje i ograniczenia testów: [tests/README.md](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/tests/README.md).
