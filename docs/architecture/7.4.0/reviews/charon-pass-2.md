# CHARON — PRZEBIEG 2: review wrogi

**Werdykt:** minimalna poprawka usuwa wyjątki, lecz uruchamia niezweryfikowaną sekwencję zapisów z odtworzonym scenariuszem częściowego usunięcia danych; PR-001 wymaga uzupełnienia, a D07 rewizji założeń.

## Zakres, SHA i kolejność przebiegów

| Przedmiot | Potwierdzony SHA |
| --- | --- |
| docs/architecture-7.4.0 | `7ed2419c3eca11b7becc53acd68a753f141df8f5` |
| fix/splat-replacement | `16c817a7c81e737cac6c855bc3e455181ea17a6a` |
| v7.4.0 | `32e360a6953d41685bc605ba2cc68e9998b2f9b8` |
| początek zakresu dokumentacji | `8f19211439e4d5ad3c0b0fec256ff55098f609df` |

Weryfikacja obu gałęzi przed PRZEBIEGIEM 1 dała dokładnie oczekiwane SHA. Nie zastąpiono ich bieżącym main. Przed rozpoczęciem tego przebiegu zapisano i odczytano ponownie [PRZEBIEG 1](https://github.com/ThresholdOps/Foundry_WoD20/blob/07977698a9898ee8ec907c3f200acb66102733bd/docs/architecture/7.4.0/reviews/charon-pass-1.md), commit `07977698a9898ee8ec907c3f200acb66102733bd`. Raport pierwszy pozostaje niezmieniony. Zapis dotyczy wyłącznie raportów na osobnej gałęzi; nie zmieniono ocenianego kodu ani dokumentacji Morosa.

Dowody kodowe poniżej odnoszą się do v7.4.0, chyba że link wskazuje commit poprawki lub dokumentacji. Waga dotyczy znaczenia ustalenia dla odbioru. Nie każde PARTIAL oznacza fałsz: rozdzielam nieprawdziwe uogólnienie, brak niezależnego dowodu i ograniczenie środowiska.

## Metoda drugiego przebiegu

Punktem wyjścia było szukanie kontrprzykładów: custom Splat i niedostępny pak, hybryda z Itemem innej linii, ukryta moc/Trait, Ghoul/Ananasi bez generation, Willpower 5th, legacy korzystające ze wspólnej tabeli oraz klient bez pełnych uprawnień. Nie dodawano wymagań do upstream ani kodu naprawczego.

Dodatkowo wykonano cztery izolowane wywołania rzeczywistego `DropSplatToActor` i jego importerów: baza/poprawka × brak paku/odrzucony odczyt paku. Było to wykonanie JavaScript w V8 przez `new Function`, po usunięciu wyłącznie deklaracji importów/eksportu; atrapy zastępowały zewnętrzne API dokumentów. Nie był to runner Node ani Foundry. Wykorzystano funkcje fixture z testu Morosa i jawnie zmienione wejścia opisane w ADV-001. Nie podmieniano implementacji DropSplatToActor, ImportAbility ani GetCompendiumItem.

**Foundry V14: NOT TESTED.** Pełnego npm test 206/209 nie powtórzono; wyniki autora pozostają wynikami autora. Niezależny czerwony/zielony z PRZEBIEGU 1 pozostaje ważny: baza 2 PASS/1 FAIL, poprawka 3 PASS/0 FAIL. Utrata środowiska terminalowego ograniczyła dalsze wykonania; nie uzupełniono brakujących wyników analizą statyczną.

## Rozstrzygnięcia T1–T10 i commita

| ID | Werdykt | Dowód i wynik próby obalenia | Waga |
| --- | --- | --- | --- |
| T1 | CONFIRMED | [module/scripts/drop-helpers.js:549](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L549), :568–578. TDZ i niewłaściwy receiver istnieją niezależnie. Pierwszy wyjątek potwierdza wykonanie. Commit v6.0.0 fde82f1d ma oba; rodzic nie ma tej metody. Nie znaleziono zwykłej ścieżki udanej wymiany istniejącego Splata, którą ten kod obsługiwał przed poprawką. Historia wspiera VERIFIED(code/history), nie historię zachowania UI na wszystkich wydaniach. | MAJOR |
| T2 | PARTIAL dla szerokiego zdania o wszystkich dziewięciu; CONFIRMED dla warunków i katalogu | [d00-verification.md:62](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d00-verification.md#L62), [templates/actor/parts/macro_icons.hbs:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/templates/actor/parts/macro_icons.hbs#L6), :20; [module/scripts/combat-helpers.js:93](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/combat-helpers.js#L93). Dwa Savage Garou mają variantsheet=werewolf, siedem Fera changingbreed. Równość splat==werewolf pomija te identyfikatory, lecz współczesne Fera również nie przechodzą tego warunku. Nie dowiedziono, że wszystkie dziewięć powinno otrzymać wszystkie makra Garou ani że każda ich forma jest niesprawna. INFERRED skutku w D00 jest uczciwe; Q-07 usuwa to ograniczenie. | MAJOR |
| T3 | PARTIAL | [module/scripts/drop-helpers.js:1142](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L1142), [module/scripts/drop-helpers.js:1283](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L1283)–1334, [module/scripts/drop-helpers.js:1542](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L1542)–1552. Pierwszeństwo poprawnie rozwiązanego źródła compendium utrzymuje się dla importowanych składników; istniejąca cecha aktora może zablokować import wcześniej. Brak paku lub odrzucone getDocuments nie przechodzi do osadzonej kopii: importer rzuca. ADV-001 wykonuje tę pominiętą ścieżkę. „Compendium wygrywa” nie jest uniwersalnym kontraktem instalacji ani dowodem niezawodności fallbacku. | MAJOR |
| T4 | PARTIAL | [checks/check-splat-references.py:7](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/checks/check-splat-references.py#L7)–27, [data/splat-pack-catalog.json:1](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/data/splat-pack-catalog.json#L1). 115 i suma 4840 wystąpień wynikają z opublikowanego katalogu; 9 id jest odtwarzalne przez filtr. 4840 nie oznacza 4840 unikalnych UUID. Dodatkowo checker porównuje tylko segmenty [2] i [4], bez prefiksu, namespace, typu dokumentu i końcówki. ADV-002 pokazuje niewystarczający warunek poprawności pełnego UUID. Nie znaleziono konkretnego błędnego UUID w dostarczonych danych; nie wolno zamienić słabości walidatora w twierdzenie o zerwanych referencjach. Pełny niezależny odczyt Splats ogranicza brak dziennika opisany w raporcie 1. | MAJOR |
| T5 | PARTIAL | [module/actor/data/wod-actor-base.js:183](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L183)–199, :257–284, :499–575; [module/scripts/drop-helpers.js:1303](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L1303)–1307, :1318–1331; [templates/actor/parts/macro_icons.hbs:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/templates/actor/parts/macro_icons.hbs#L6). Odbudowa określonych map i flag z Itemów jest VERIFIED. To nie znaczy, że cała dostępność cech jest niezależna od Game/Splat: makra mają bramki linii, a alwaysspeciality jest wybierane według settings.game. Ponadto flagi mocy i form nie stosują ogólnego filtra widoczności, wbrew SOT-007. 46 to liczba wierszy tabeli grupowania autora; brak utrwalonego klucza grupowania, więc nie potwierdzam 46 jako automatycznie odtworzonej partycji danych. | MAJOR |
| T6 | REFUTED w ogólnej postaci | [module/actor/data/wod-actor-base.js:286](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L286)–340, :399–438, :1666–1713; [module/items/data/wod-item-base.js:247](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/items/data/wod-item-base.js#L247)–261. W Willpower 5th max jest wejściem/ograniczeniem, zapis obejmuje permanent/temporary/roll. Itemowa gałąź willpower również nie przelicza max ze statystyk. Ghoul/Ananasi bez generation omijają normalizację Blood Pool; sam D02:86 to odnotowuje. Paradox wymaga Quintessence, Essence Pool własnej gałęzi. Zapisy są warunkowe, nie wykonywane zawsze. FND-014/RSK-017/DEC-014 nie mogą dziedziczyć VERIFIED dla tezy o nadpisaniu max wszystkich czterech. | MAJOR |
| T7 | PARTIAL | [module/actor/data/wod-actor-base.js:1120](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L1120)–1186, :401–402, :1075–1076; [d07-roadmap.md:23](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d07-roadmap.md#L23) i :46. Nie ma podstaw do nowego silnika zasobów dla samej tabeli pojemności. Ale kod ma osobne funkcje max i Spend, używane przez PC i legacy; pełna semantyka dozwolonych zastosowań krwi nie wynika z samej tabeli. D07 zresztą wymienia MaxBlood/Spend oraz otwartą DEC-010. „Jedna funkcja” jest uproszczeniem tylko wariantu pojemności, nie pełnego #973. | MAJOR |
| T8 | PARTIAL | [module/actor/data/wod-actor-base.js:31](https://github.com/ThresholdOps/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/data/wod-actor-base.js#L31)–67, :199, :591–593; [d01-capability-catalog.md:110](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d01-capability-catalog.md#L110)–118. Async wywołany bez await, brak owner gate przy próbie updateEmbeddedDocuments oraz permission<3 w derived są w kodzie. Słabszy klient może więc omijać derived, a nadal dojść do próby zapisu inną ścieżką. Nie udowodniono jednak rzeczywistych wysyłek z każdego klienta, uprawnień transportu ani skutku renderowania w core V14. D01 rozróżnia INFERRED/HYPOTHESIS; GAP-014 i skróty nie zachowują tego konsekwentnie. Nie wykonano testu wieloklientowego. | MAJOR |
| T9 | REFUTED | [d07-roadmap.md:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d07-roadmap.md#L6) i :18; [module/scripts/drop-helpers.js:568](https://github.com/ThresholdOps/Foundry_WoD20/blob/16c817a7c81e737cac6c855bc3e455181ea17a6a/module/scripts/drop-helpers.js#L568)–577, :580–644, :1541–1545. ADV-001: przed poprawką wyjątek występuje bez zapisów; po poprawce brak/odrzucenie odczytu paku następuje po usunięciu starego Splata oraz Ability value=0. Nie zachodzi zapis ustawień nowego Splata ani przywrócenie usuniętych dokumentów. To obala argument „gałąź była martwa, więc uruchomienie jest bezpieczne”. Nie przedstawiam tego jako regresji wcześniej udanej wymiany; pogarsza się zachowanie przy błędzie i zachowanie danych. | MAJOR |
| T10 | PARTIAL | [d07-roadmap.md:6](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/d07-roadmap.md#L6)–57. Pierwszeństwo małej naprawy nadal ma sens organizacyjny, ale niskie ryzyko/pełna odwracalność nie mają dowodu po ADV-001. Q-07 promuje INFERRED do faktu, DEC-014 opiera ogólne zalecenie na fałszywym T6. Q-03 i Q-06 mają część rozstrzygalną z kodu. Q-01/Q-02/Q-04/Q-05/Q-08/Q-09 mogą dotyczyć polityki i zamiaru maintenera; nie są dowodem brakującej wiedzy o obecnym wykonaniu. Nie odrzucono całej kolejności wyłącznie za pytania o intencję. | MAJOR |
| 16c817a | PARTIAL — FIXES REQUIRED | [module/scripts/drop-helpers.js:568](https://github.com/ThresholdOps/Foundry_WoD20/blob/16c817a7c81e737cac6c855bc3e455181ea17a6a/module/scripts/drop-helpers.js#L568), [tests/drop-splat.test.mjs:29](https://github.com/ThresholdOps/Foundry_WoD20/blob/16c817a7c81e737cac6c855bc3e455181ea17a6a/tests/drop-splat.test.mjs#L29)–54, :89–96, :100–141. Diff produkcyjny jest minimalny i naprawia oba wyjątki; test rzeczywiście wywołuje kod produkcyjny i ma niezależnie odtworzony wynik czerwony/zielony. Wszystkie komponenty Splata w jego fixture są jednak puste. Brakuje podstaw do akceptacji nowo osiągalnej operacji z zapisami na podstawie wyłącznie tych trzech przypadków; ADV-001 jest konkretnym ujemnym wynikiem ścieżki błędu. | MAJOR |

## ADV-001 — co dokładnie wykazała próba błędu importu

**Status dowodu:** VERIFIED w izolowanym wykonaniu JavaScript z symulowanymi dokumentami. Trwały skutek w Foundry V14: **INFERRED / NOT TESTED**. Prawdopodobieństwo napotkania brakującego/niedostępnego paku w rzeczywistym świecie: **NOT VERIFIABLE w tym zakresie**, nie oszacowano go.

Wejście pochodzi z createActor/createSplat w teście Morosa, z następującymi zmianami:
- aktor ma dotychczasowy Splat `splat-old`, zwykły Item `gear-1` i własną Ability `note-zero` z value=0 oraz niepustym description;
- system.abilities i system.advantages są pustymi obiektami, aby importer nie zakończył się przez „już istnieje”;
- nowy Splat ma jedną Ability o nowym system.id i UUID `Compendium.world.review-source.Item.AbCdEfGh12345678`; pozostałe listy są puste;
- potwierdzenie dialogu = yes; duplicate kopiuje JSON; API delete z fixture rejestruje ID i usuwa je z tablicy;
- wariant A: game.packs nie zawiera `world.review-source`;
- wariant B: pak istnieje, ale jego getDocuments zwraca odrzuconą Promise z `Error("PACK_READ_FAILED")`.

| Wejście | v7.4.0 | 16c817a |
| --- | --- | --- |
| A: brak paku | ReferenceError przed usuwaniem; pozostają splat-old, gear-1, note-zero | TypeError przy getDocuments; usunięte splat-old i note-zero; pozostaje gear-1 |
| B: odrzucony odczyt | ReferenceError przed usuwaniem; pozostają wszystkie trzy | PACK_READ_FAILED; usunięte splat-old i note-zero; pozostaje gear-1 |

We wszystkich czterech wywołaniach: zero createEmbeddedDocuments i zero końcowych actor.update. Poprawka nie zawiera nowego rollbacku; analiza dalszego kodu nie znajduje odtworzenia usuniętych dokumentów w tych ścieżkach.

Sekwencja w bazie: delete starego Splata :568–572 → modyfikacje flag istniejących cech :584–628 → delete Ability value=0 :631–634 → ImportAbility :643–644 → GetCompendiumItem :1542–1545 → tworzenie składników :750–752 → actor.update :819. W poprawce od obszaru za zmienionym blokiem linie przesuwają się o −1. Pierwszy wyjątek maskował pozostałą sekwencję.

**Granica zarzutu:** nie znaleziono dowodu, że usuwanie własnych Ability value=0 samo w sobie jest niezamierzone — to już istniejąca polityka kodu. Zarzut dotyczy przerwania po usuwaniu, bez ukończonej instalacji. Nie dowiedziono też regresji działającego anulowania lub pierwszej instalacji: te dwa przypadki przeszły zarówno na bazie, jak i poprawce. Nie należy naprawy TDZ odrzucać jako błędnej; niewystarczające jest przedstawienie jej jako bezpiecznej całości.

Odwrócenie commita cofa kod, **nie przywraca danych aktora** usuniętych przez jego wykonanie. Dlatego „pełna odwracalność” w D07 wymaga innej granicy niż revert w Git.

## ADV-002 — próba obalenia walidatora UUID

Checker tworzy klucz `(p[2], p[4])` dla len(p)>=5. Dwa ciągi:
- `Compendium.worldofdarkness.review-source.Item.new-ability`
- `Garbage.other-system.review-source.Actor.new-ability.extra`

dają identyczny klucz `("review-source", "new-ability")`. Jeśli taki rekord istnieje w src, oba powiększają references_ok. To odtworzenie projekcji segmentów w JavaScript i dowód z instrukcji Python :21–24; **nie uruchomienie oryginalnego skryptu Python** ani dowód występowania drugiego ciągu w pakach.

Wniosek jest ograniczony: wynik „0 missing” tej procedury oznacza istnienie pary pak–ID po wybranej projekcji. Sam nie dowodzi pełnej poprawności i rozwiązywalności każdego UUID w Foundry. Z kolei opublikowany katalog podsumowań nie zachowuje wszystkich pierwotnych UUID, więc nie uzupełnia tego dowodu. Nie nadaję danym statusu REFUTED wyłącznie za lukę w checkerze.

## Kontrprzykłady dla uogólnień o liniach i zasobach

| Przypadek | Co wynika z kodu | Czego nie wykazano |
| --- | --- | --- |
| PC z niewidoczną mocą lub Trait formy | allpowers/shapes nie mają ogólnego filtra isvisible; odpowiednia flaga może być true mimo ukrytego Itemu (:191–193, :520–575) | że wszystkie widoki pokażą ukryty Item |
| hybrydowy PC z cechą innej linii | obecność Itemu może nadać has*, lecz macro_icons nadal porównuje splat | że każda akcja tej cechy działa niezależnie od Game/Era/Splat |
| import Ability ze źródła | alwaysspeciality jest pochodną settings.game (:1303–1304) przed końcowym przepisaniem Game (:812) | regresji nowej poprawki; ta kolejność istniała wcześniej |
| Ghoul/Ananasi bez generation | brak wejścia w gałąź normalizacji Blood Pool (:400); D02:86 potwierdza rozróżnienie danych | uniwersalnego nadpisywania ich max co przygotowanie |
| standardowy Willpower 5th | composure+resolve zmienia permanent/roll; max jest limitem odczytywanym, nie wynikiem | że każda dowolna grupa custom-Willpower ma te same zasady; np. group=virtue ma odrębną regułę |
| legacy Vampire | używa wspólnej tabeli MaxBlood i Spend (:1075–1076) | bezpieczeństwa zmiany tabeli sprawdzonego wyłącznie na PC |
| Savage Fera | również modern Fera nie przechodzi warunku splat==werewolf | że wszystkie siedem Savage Fera to regresja Frenzy/Shapechange wobec modern |

Są to kontrprzykłady statyczne; poza ADV-001 nie są tu oznaczane jako wykonane scenariusze.

## Pytania Q-01..Q-09 po drugim przebiegu

| ID | Ocena dowodowa |
| --- | --- |
| Q-01 | właściwe pytanie o proces; „od v6” oznacza obecność defektu w źródle, nie test UI wszystkich wersji |
| Q-02 | właściwe rozstrzygnięcie przyszłej semantyki; obecny związek flag w kodzie nie ustala zamiaru maintenera |
| Q-03 | obecne sumowanie mnożników jest rozstrzygalne; decyzją pozostaje przyszły porządek i semantyka premii |
| Q-04 | dopuszczalne pytanie o zakres/konfigurację rozwiązania; nie traktować go jako zastępstwa znanych wymagań |
| Q-05 | potrzebny wybór zakresu: pojemność vs ograniczenia użycia; odpowiedź rozstrzyga, czy jedna tabela wystarczy |
| Q-06 | przypisanie abilities z powers jest faktem z kodu; zamierzoność to odrębna decyzja, nie brak dowodu przypisania |
| Q-07 | sugeruje odpowiedź i rozszerza INFERRED na wszystkie makra/formy dziewięciu Splatów; wymaga rewizji |
| Q-08 | pytanie o utrzymanie jest dopuszczalne; brak importów nie dowodzi braku jakiegokolwiek dynamicznego użycia |
| Q-09 | może dotyczyć zamierzonej polityki kwalifikacji, podczas gdy obecny warunek oparty na bloodpool jest już opisany |

Nie przygotowano nowej wiadomości ani promptu do Johana; niczego nie wysłano.

## Znaleziska spoza listy T1–T10

### R2-A — MAJOR: spójność rejestru nie wytrzymuje próby odczytu maszynowego

Podtrzymuję R1-A. [discovery.json:206](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/discovery.json#L206) nadal opisuje D07 jako NOT_STARTED, a Markdown zawiera gotowy draft i backlog. [discovery.json:2628](https://github.com/ThresholdOps/Foundry_WoD20/blob/7ed2419c3eca11b7becc53acd68a753f141df8f5/docs/architecture/7.4.0/discovery.json#L2628) utrzymuje TEST-005 NOT TESTED, podczas gdy testing.md raportuje pełny wynik autora. Nowe findings odsyłają do RSK-010–017/GAP-011/013/014/REG-015, których nie ma w odpowiednich wcześniejszych katalogach JSON. Nie ma jawnej zasady, że nowy rekord wersjonuje i zastępuje wcześniejszy. To daje różne odpowiedzi zależnie od czytanego pliku, a nie tylko kosmetyczną rozbieżność.

Nie znaleziono duplikacji ID w poszczególnych kolekcjach sprawdzonych w pierwszym przebiegu. Problemem są niezsynchronizowane wartości i rozwiązywanie odwołań, nie udowodnione powielenie identyfikatorów.

### R2-B — MINOR: testowa deklaracja o kopiowaniu Foundry jest mocniejsza od dowodu

[tests/drop-splat.test.mjs:7](https://github.com/ThresholdOps/Foundry_WoD20/blob/16c817a7c81e737cac6c855bc3e455181ea17a6a/tests/drop-splat.test.mjs#L7) mówi, że duplicate Foundry jest JSON round trip. Uruchomiony test dowodzi zachowania lokalnej atrapy ustawionej w następnej instrukcji; nie potwierdza sam przez się implementacji Foundry V14. Samo zastąpienie clone dla fixture jest dopuszczalne, lecz ta deklaracja nie może być dowodem równoważności środowisk. Ograniczenie dotyczy także atrap create/update, które nie wykonują DataModel, hooków ani ponownego przygotowania dokumentu.

### R2-C — MINOR: liczba profili i plików testowych nie ma tego samego rodzaju dowodu

Podtrzymuję R1-C: 46 jest policzalne jako wiersze tabeli autora, a nie jako wynik udokumentowanego algorytmu grupowania 115 Splatów. W bazie jest 12 plików *.test.mjs; trzynasty jest nowym testem poprawki. Nie kwestionuje to wykonanych 3 przypadków, lecz wymaga ostrożności przy przenoszeniu liczników między bazą a poprawką.

## Kontrola statusów wiedzy i testów

- **VERIFIED(code):** dwa wyjątki, kolejność delete/import/update, pola payloadu Willpower, warunki Game/Splat, ograniczenie checkera.
- **VERIFIED(isolated execution):** czerwony/zielony Node z przebiegu 1 oraz cztery dodatkowe wykonania V8 z tego przebiegu; środowiska rozróżniono.
- **INFERRED:** trwały efekt sekwencji w rzeczywistym Foundry, skutki warunków Savage w UI oraz zachowanie wieloklientowe.
- **HYPOTHESIS:** częstość błędów odczytu w realnych światach i konkretne efekty wyścigów/renderowania; nie podano ich jako zaobserwowanych usterek.
- **NOT VERIFIABLE tutaj:** niezależna pełna rekonstrukcja Splats z dziennikiem i rzeczywiste rozwiązywanie wszystkich UUID przez Foundry.

Nie znaleziono wpisu PASS(Foundry) opartego na samej analizie statycznej. Istnieje natomiast utrata kwalifikatorów między szczegółowym opisem i podsumowaniem: T6 jako VERIFIED, Q-07 jako pewny skutek, GAP-014 jako pewny kontrakt platformy. To wymaga rewizji dokumentacji, mimo jawnego NOT TESTED w tabelach testów.

## Sekcja wspólna — wynik obu przebiegów

### Co się zmieniło i dlaczego

Pierwszy przebieg dopuścił PR-001 do odbioru Foundry jako wąską naprawę dwóch wyjątków, już odrzucając T9 jako logiczny argument bezpieczeństwa. Drugi wykazał konkretny wynik ujemny, zamiast samej możliwości: po tej naprawie błąd odczytu występuje po usuwaniu dokumentów, bez ukończenia instalacji. Wymaganie dopuszczenia do odbioru jest zatem ostrzejsze niż wstępny werdykt.

T4 pozostaje PARTIAL, ale waga rośnie z MINOR do MAJOR: granica pobrania danych z pierwszego przebiegu była ograniczeniem narzędzia, natomiast drugi znajduje lukę samego warunku walidacji. Nie oznacza to odkrycia realnie zerwanych UUID. T2 w tabeli pierwszego przebiegu było CONFIRMED w wyraźnie ograniczonych granicach; drugi rozbija je na potwierdzone warunki/katalog i PARTIAL szerokiego skutku dla wszystkich dziewięciu. Nie odwołuje to wcześniejszego rozpoznania deviant id.

T6 pozostaje REFUTED; kontrola itemowego kalkulatora Willpower nie uratowała twierdzenia o wyliczaniu max. T5/T8/T10 pozostają PARTIAL. Zasadność małej poprawki jako kierunku nie jest dowodem bezpieczeństwa nowo osiągalnego przepływu.

### Werdykty końcowe

| Przedmiot | Werdykt | Uzasadnienie |
| --- | --- | --- |
| **PR-001 / 16c817a** | **FIXES REQUIRED** | naprawa wyjątków jest poprawna, ale obecny materiał akceptacyjny obejmuje pusty Splat i nie rozlicza odtworzonego przerwania po usunięciu danych; nie ma podstaw do nazwania całości bezpieczną i w pełni odwracalną |
| **roadmapa D07** | **REVISE** | zachować kierunek małych niezależnych zmian, skorygować bezpieczeństwo PR-001, semantykę max/Willpower i DEC-014, zakres Savage/Q-07 oraz rejestry |

FIXES REQUIRED nie oznacza odrzucenia usunięcia TDZ ani zgody na szeroki refaktor. Nie nadano READY FOR FOUNDRY ACCEPTANCE na podstawie samej poprawności małego diffu. Zachowanie danych przy błędzie i jego pokrycie pozostają materialną przeszkodą. W tej recenzji niczego nie zaimplementowano.

**Jeden rekomendowany następny krok:** wykonać w Foundry V14 na kopii aktora kontrolowany scenariusz ADV-001 z odrzuconym odczytem compendium i rozliczyć stan dokumentów po błędzie jako warunek odbioru PR-001.

OUT OF SCOPE: implementacja napraw, projektowanie #941 i innych kandydatów, nowa runda promptów, publikowanie pytań lub PR do upstream.
