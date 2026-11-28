# D03 — komponenty, interfejsy i rozszerzenia
Nazwy CMP są identyfikatorami dokumentacyjnymi. Nie zakładają istnienia klas o nazwie „Bonus Engine” czy „Resource Engine”. Odpowiedzialności przecinają pliki i warstwy.

## Component Catalog
| ID | Komponent / odpowiedzialność | Wejścia → konsumenci | Klasyfikacja | Główny dowód / ograniczenie |
| --- | --- | --- | --- | --- |
| CMP-001 Bootstrap | Rejestracja i inicjalizacja; migracja dla GM | CONFIG, settings, modele i karty → dokumenty i UI | GENERIC | [wod.js:70](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/wod.js#L70); Zależność od globalnego cyklu Foundry |
| CMP-002 WoDActor | Cykl życia aktora; rozgałęzienia PC/legacy | Actor.system; Itemy; uprawnienia → karty, tokeny, API | GENERIC | [module/actor/data/wod-actor-base.js:31](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L31); Asynchroniczne przygotowanie i wielokrotne miejsca aktualizacji |
| CMP-003 WoDItem | Normalizacja Item i wartości przewag | Item.system; rodzic; era → aktor, karty, rzuty | GENERIC | [module/items/data/wod-item-base.js:17](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/items/data/wod-item-base.js#L17); Obliczenia zależą także od pól przekazanych w updateData |
| CMP-004 PC sheet | Kontekst i akcje karty PC | Actor; Itemy; CONFIG; użytkownik → DOM, akcje, dialogi | PRESENTATION | [module/actor/template/pc-actor-sheet.js:44](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/template/pc-actor-sheet.js#L44); Zawiera również reguły właściwe dla linii |
| CMP-005 Legacy sheets | AppV1 i baza starszych kart | starsze typy Actor; template.json → akcje, dialogi, HTML | GAME-SPECIFIC | [module/actor/template/mortal-actor-sheet.js:17](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/template/mortal-actor-sheet.js#L17); Inny format ruchu i przewag niż PC |
| CMP-006 Actions | Akcje UI, mutacje i wybór dialogów | dataset, Actor, Item → dialogi, zapis, tokeny | GENERIC | [module/scripts/action-helpers.js:57](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/action-helpers.js#L57); To także miejsce zapisu, nie tylko dispatcher |
| CMP-007 Splat and drop | Import, instalacja i reset składników | Splat; świat; compendia; UUID → Actor i embedded Itemy | SPLAT-SPECIFIC | [module/scripts/drop-helpers.js:549](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L549); Operacje wieloetapowe; reset usuwa wszystkie Itemy; PROBE-001 |
| CMP-008 Creation helpers | Inicjalizacja oraz dostępne akcje | typ, era, wariant, zasoby → karty, drop, tworzenie | GAME-SPECIFIC | [module/scripts/create-helpers.js:8](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/create-helpers.js#L8); Łączy inicjalizację i prezentację |
| CMP-009 Totals | Sumy cech, soak, zdrowia i inicjatywy | snapshot; Bonusy; live Actor i pancerze → karty, zapis, ruch, rzuty | GENERIC | [module/scripts/totals.js:3](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/totals.js#L3); Odczytuje game.actors; nie jest czystą funkcją argumentu |
| CMP-010 Bonus helpers | Kategorie i agregowanie premii | Bonus i bonuslist; cel; aktywność → totals, dialogi, combat | CAPABILITY-SPECIFIC | [module/scripts/bonus-helpers.js:3](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/bonus-helpers.js#L3); Wartość, kości, trudność i sukcesy mają inną semantykę |
| CMP-011 Combat helpers | Ruch, zdrowie i powiązania walki | atrybuty, formy, premie, token → aktor, rzuty, inicjatywa | GENERIC | [module/scripts/combat-helpers.js:7](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/combat-helpers.js#L7); Cykl importów z roll-dice; różne formaty ruchu |
| CMP-012 Health | Tory obrażeń i Corpus | health.damage; poziomy; corpus → karty i zdrowie | CAPABILITY-SPECIFIC | [module/scripts/health.js:19](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/health.js#L19); Chimerical i Corpus wymagają osobnych przypadków |
| CMP-013 Roll engine | Wynik rzutu, wydanie Willpower i czat | DiceRollContainer; CONFIG; Actor; Roll → ChatMessage, sukcesy, combat | GENERIC | [module/scripts/roll-dice.js:285](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/roll-dice.js#L285); Rzut może zmienić trwały zasób |
| CMP-014 Roll dialogs | Składanie puli; osobne dialogi broni, mocy, Arete i soak | aktor, Item, total, premie → DiceRoller | CAPABILITY-SPECIFIC | [module/dialogs/dialog-generalroll.js:7](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/dialogs/dialog-generalroll.js#L7); Test silnika nie dowodzi poprawności każdej puli |
| CMP-015 Augmentation | Trzy zarządzane Bonusy i zapis sum | PC; widoczny bloodpool; flagi; fixed ID → Actor, Item, popup | CAPABILITY-SPECIFIC | [module/scripts/attribute-augmentation-helpers.js:258](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/attribute-augmentation-helpers.js#L258); Kolejka lokalna; ograniczenie między klientami omówione w #1366 |
| CMP-016 Bio visibility | Widoczność Bio według widza | bio.visibility; rola → Handlebars i ustawienia | PRESENTATION | [module/scripts/bio-visibility.js:1](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/bio-visibility.js#L1); Nie potwierdza serwerowej redakcji danych |
| CMP-017 Settings and selectors | Ustawienia i listy select-helpers/select/* | game.settings; CONFIG; aktor → karty, dialogi, reguły | GENERIC | [module/settings.js:1](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/settings.js#L1); Era ma dwa formaty zapisu |
| CMP-018 Migration | Aktualizacja aktorów, Itemów i compendiów świata | wersje i dokumenty → zapisy; notyfikacje | GENERIC | [module/migration.js:10](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/migration.js#L10); Błędy częściowe; pełna migracja wymaga świata testowego |
| CMP-019 Public PC API | Rzuty, Itemy i zdrowie przez actor.api | PC; identyfikatory; opcje → akcje, dialogi, silnik | CAPABILITY-SPECIFIC | [module/actor/api-handler.js:15](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/api-handler.js#L15); Getter nie udostępnia API dla legacy |
| CMP-020 Hooks and views | Render, klasy i integracja dragRuler | hooki Foundry, CONFIG, aktor → DOM i prędkości | PRESENTATION | [module/hooks.js:57](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/hooks.js#L57); Globalny motyw; format ruchu integracji do sprawdzenia |

Pełne rekordy i identyfikatory są w discovery.json. Szczegółowy graf 245 importów zachowano w inventory.json. Import nie jest dowodem, że funkcja zostaje wywołana w danym scenariuszu.

## Interface Catalog
| ID | Interfejs | Rodzaj / kontrakt |
| --- | --- | --- |
| IF-001 | system.json.esmodules → wod.js | wejście modułu Foundry |
| IF-002 | CONFIG.Actor/Item.documentClass | zastąpienie klas dokumentów; wspólne dla wielu typów |
| IF-003 | CONFIG.Actor/Item.dataModels | rejestracja PC i pięciu typów Item |
| IF-004 | Actor prepareData/prepareDerivedData/_preCreate/_onUpdate | callback platformy; wersja i synchronizacja asynchroniczna do odbioru |
| IF-005 | WoDItem._preCreate/_preUpdate/_onUpdate | callback dokumentu; nie mylić update patch z pełnym ItemData |
| IF-006 | PCActorSheet.DEFAULT_OPTIONS.actions / form.handler | wiązanie gestu UI z handlerem |
| IF-007 | DropHelper.DropSplatToActor / RemoveSplatFromActor | wewnętrzna mutacja wielu dokumentów; różne znaczenie instalacji i resetu |
| IF-008 | calculateTotals(snapshot) | wewnętrzna funkcja async, zwraca zmodyfikowane dane i czyta game.actors |
| IF-009 | BonusHelper.Check*/Get* | wewnętrzne rozpoznanie/agregowanie poszczególnych kategorii premii |
| IF-010 | DiceRollContainer → DiceRoller | kontrakt parametrów rzutu i skutków ubocznych |
| IF-011 | actor.api | publiczne API PC: rollAttribute/rollAbility/rollAdvantage/useFeature/useCombatItem/usePower/getItemId/getAbility/getAdvantage/modifyHealth |
| IF-012 | Hooks render*/updateActor/*Item | powiązanie prezentacji i refresh popupu z dokumentami |
| IF-013 | game.settings / CONFIG.worldofdarkness | konfiguracja globalna w danym kliencie; zakres world/client zależy od rejestracji ustawienia |
| IF-014 | game.packs / getInstalledPowers / UUID import | integracja źródeł zawartości z kopiami postaci |

Źródła: [wod.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/wod.js), [module/actor/api-handler.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/api-handler.js), [module/scripts/drop-helpers.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js), [module/scripts/totals.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/totals.js), [module/ui/attribute-augmentation-popup.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/ui/attribute-augmentation-popup.js), [module/hooks.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/hooks.js).

## Extension Point Register
| ID | Punkt rozszerzenia | Granica |
| --- | --- | --- |
| EXT-001 | Splat jako Item i jego tablice składników | definicja wspólnej karty; nie automatyczny system migracji aktywnej postaci |
| EXT-002 | osadzone Ability/Advantage/Power/Trait | własne dane i identyfikatory; reguły niektórych linii nadal wymagają konkretnych id/flag |
| EXT-003 | bonuslist i Bonus | ponowne użycie agregatorów; nowy cel/operator wymaga zbadania wszystkich konsumentów |
| EXT-004 | select/* i konfiguracja era | listy i normalizacja; własne listy świata nie wynikają automatycznie z istnienia funkcji listującej |
| EXT-005 | settings i helpery Handlebars | opcje zasad i prezentacji; nie wprowadzać logiki produktu wyłącznie w CSS |
| EXT-006 | actor.api | automatyzacja PC przez istniejące wejścia; inne typy nie mają tego kontraktu |
| EXT-007 | dragRuler.ready | opcjonalny provider; dla PC sprawdzić obiekt value zamiast liczby |

## Foundry API Dependency Map
| Usługa Foundry | Wykorzystanie | Kontrola regresji |
| --- | --- | --- |
| Actor / Item / Embedded Documents | tworzenie, update, delete, kolekcje i modele | uprawnienia, patch/full data, częściowe awarie |
| DataModel / TypeDataModel / fields | schematy i migracja pól | deklaracja to inny dowód niż walidacja runtime |
| AppV1 / ActorSheetV2 / ItemSheetV2 / ApplicationV2 | karty, formularze i popupy | obie rodziny aplikacji |
| Hooks | cykl startu, renderowanie, refresh | kolejność, zamknięte okna, drugi klient |
| Roll / ChatMessage | kości i wynik | koszty zasobu, tryb wiadomości, actorless roll |
| TokenDocument / canvas / Combatant | ikony form i inicjatywa | aktor tokenowy, powiązanie sceny, wiele tokenów |
| settings / i18n / Handlebars / TextEditor | reguły, język, szablony, HTML | różne role, języki, motywy i puste wartości |
| CompendiumCollection / UUID | import i migracje zawartości świata | brakująca/zmieniona definicja, kopia na postaci |

Nie odczytywano kodu samego Foundry V14 w tej iteracji. Wnioski o kontraktach platformy ograniczono do sposobu ich użycia przez WoD20; zachowanie transportu i trwałości wymaga runtime albo źródeł API.
