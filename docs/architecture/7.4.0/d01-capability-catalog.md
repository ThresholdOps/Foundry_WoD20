# D01 — rozpoznawanie rodzaju postaci i katalog Splat × capability (iteracja 2)

Baseline `32e360a6953d41685bc605ba2cc68e9998b2f9b8`. Uzupełnia [functional-catalog.md](functional-catalog.md) Charona: jego wymiary i CAP-001–012 pozostają ważne. Ten plik odpowiada na pytanie D01, które tam zostało otwarte: **jak system decyduje, co postać ma**, i podaje katalog Splatów na danych z compendium.

## Werdykt
WoD20 ma **dwa niezależne modele capability**, a nie jeden:

| Model | Typy | Skąd biorą się możliwości | Kiedy | Dowód |
| --- | --- | --- | --- | --- |
| **Legacy** | 12 typów Actor (Vampire, Werewolf, … Creature) | flagi `settings.has*` ustawiane przez `CreateHelper` według typu aktora | przy tworzeniu (`_preCreate`), potem trwałe | `create-helpers.js` (86 zapisów `has*`), szablony `templates/actor/*.html` (22 różne flagi) |
| **PC** | `PC` | **obecność osadzonych Itemów**: przewagi po `system.id`/`group`, moce po `system.type`, Trait po typie | przy każdym przygotowaniu danych | `wod-actor-base.js:177-602` (`_prepareCharacterData`) |

Co to znaczy: dla PC capability **nie jest konfiguracją, tylko skutkiem składu Itemów**. Dodanie przewagi `gnosis` do dowolnej postaci PC daje jej `hasgnosis`, niezależnie od Game i Splata. To daje prawdziwe postacie hybrydowe (Mage + Ghoul z #1359). Wymaga to jednak, by każda funkcja CAPABILITY-SPECIFIC sprawdzała Item, a nie nazwę linii.

Game, Era i Splat pełnią w PC inną rolę: **wybierają wygląd, listy i reguły specjalne**, a nie dostępność cech. Kopiowane są raz, przy instalacji Splata (`drop-helpers.js:808-815`).

## Jak PC rozpoznaje „kim jest”
| Pytanie | Mechanizm | Dowód | Status |
| --- | --- | --- | --- |
| Jaki wygląd karty, ikony, fonty? | `getSplat`: `variantsheet → splat → game → typ aktora`, `pc` → `mortal` | `pc-actor-sheet.js:993-1007`; `hooks.js:463-489`; `attribute-augmentation-popup.js:49-52` | VERIFIED |
| Jaki typ mocy (discipline/gift/…)? | `getPowertype`: `variantsheet → splat → typ` | `pc-actor-sheet.js:1009+` | VERIFIED |
| Czy ma Willpower/Gnosis/Virtues/Renown/Quintessence? | widoczna przewaga o danym `id`/`group` | `wod-actor-base.js:257-284` | VERIFIED |
| Czy ma Disciplines/Gifts/Rites/Spheres/…? | moc o danym `system.type` | `wod-actor-base.js:499-567` | VERIFIED |
| Czy ma formy / Apocalyptic Forms / Resonance / Passions / Fetters? | Trait o danym `system.type` | `wod-actor-base.js:571-575` | VERIFIED |
| Czy ma Corpus / Essence Pool? | przewaga `corpus` / `essencepool` → dodatkowe obliczenia | `wod-actor-base.js:578-588` | VERIFIED |
| Czy może augmentować atrybuty krwią? | widoczna przewaga `bloodpool`, wariant ≠ `earthbound`, właściciel | `attribute-augmentation-popup.js:55-61` | VERIFIED |
| Reguły specjalne linii (frenzy, shapechange, Glabro/Crinos, rangi) | porównanie `settings.splat` z nazwą linii | FND-003 | VERIFIED; luka dla Savage Age |

Odpowiedź na pytanie z D01 („czy Game, Era, Splat i capability są niezależnymi wymiarami”): **w zapisie tak, w kodzie częściowo**. Capability są niezależne od Game/Splat (wyprowadzane z Itemów). Era jest niezależnym polem, ale w Savage Age jest też zakodowana w `settings.splat` (FND-003). Wygląd zależy od `variantsheet`, a reguły specjalne od `splat`. To są dwa różne pola, które zwykle mają tę samą wartość, ale nie zawsze.

## Splat × capability — katalog z compendium
Źródło: [data/splat-pack-catalog.json](data/splat-pack-catalog.json), 115 Splatów pogrupowanych w 46 profili. Kolumna capability pokazuje to, co `_prepareCharacterData` wyprowadzi z dostarczonych Itemów (INFERRED z kodu + danych, bez runtime). „Zasoby” to przewagi o znaczeniu zasobu. Ich semantyka nie jest wspólna (D02).

| Game | settings.id → `settings.splat` | variantsheet | era | variants | capability wynikające z danych | liczba | przykład |
| --- | --- | --- | --- | --- | --- | --- | --- |
| changeling | `changeling` | `changeling` | modern | darkkin, dauntain, general, inanimae, menehune, nunnehi, thallain | haswillpower; zasoby: glamour/banality/nightmare; shapeform; usechimerical | 7 | Changeling [modern] |
| changeling | `mortal` | `mortal` | modern | enchanted | haswillpower; zasoby: glamour/banality | 1 | Enchanted [modern] |
| changeling | `changeling` | `changeling` | modern | hsien | haswillpower | 1 | Hsien [modern] |
| changeling | `mortal` | `mortal` | modern | general | haswillpower; zasoby: banality | 1 | Mortal [modern] |
| werewolf | `changingbreed` | `changingbreed` | modern | ajaba, apis, bastet, camazotz, corax, grondr, gurahl, kitsune, mokole, nagah, ratkin, rokea | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 30 | Ajaba |
| werewolf | `changingbreed` | `changingbreed` | modern | ananasi | haswillpower; hasgnosis; hasrenown; zasoby: bloodpool; shapeform | 1 | Ananasi |
| werewolf | `changingbreed` | `changingbreed` | modern | nuwisha | haswillpower; hasgnosis; hasrenown; shapeform | 1 | Nuwisha |
| demon | `demon` | `demon` | modern | general | haswillpower; hasvirtue; zasoby: faith/torment/conviction; shapeform | 1 | Demon [modern] - blank |
| demon | `demon` | `demon` | modern | general | haswillpower; hasvirtue; zasoby: faith/torment/conviction; shapeform; apocalypticform | 21 | Demon [modern] Defiler (Adad) |
| demon | `demon` | `demon` | modern | earthbound | haswillpower; zasoby: faith/faithpool | 1 | Earthbound [modern] - blank |
| demon | `mortal` | `mortal` | modern | thrall | haswillpower; hasvirtue; zasoby: faith/torment/conviction | 1 | Thrall [modern] |
| exalted | `exalted` | `exalted` | modern | abyssal | haswillpower; zasoby: essencepool | 1 | Abyssal Exalted |
| exalted | `exalted` | `exalted` | modern | alchemical, dragon, liminal, sidereal, solar | haswillpower; zasoby: essencepool/limitbreak | 5 | Alchemical Exalted |
| exalted | `exalted` | `exalted` | modern | infernal, lunar | haswillpower; zasoby: essencepool/limitbreak; shapeform | 10 | Infernal Exalted [demon emperor] |
| hunter | `hunter` | `hunter` | modern | general | haswillpower; zasoby: conviction | 1 | Hunter [modern] |
| mage | `mage` | `mage` | modern | general | haswillpower; hasquintessence; hasspheres; zasoby: arete/paradox | 1 | Mage [modern] |
| mage | `mage` | `mage` | victorian | general | haswillpower; hasquintessence; hasspheres; zasoby: arete/paradox | 2 | Mage [sorcerers crusade] |
| mage | `mortal` | `mortal` | modern | general | haswillpower | 1 | Mortal [modern] |
| mage | `mortal` | `mortal` | modern | sorcerer | haswillpower; hasquintessence | 1 | Sorcerer [modern] |
| mummy | `mummy` | `mummy` | modern | general | haswillpower; zasoby: sekhem | 1 | Mummy [modern] |
| werewolf | `anupabael` | `werewolf` | savage | general | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Anupa-Ba-El [savage age] |
| werewolf | `apis` | `changingbreed` | savage | apis | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Apis [savage age] |
| werewolf | `ceilican` | `changingbreed` | savage | ceilican | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Ceilican [savage age] |
| werewolf | `bilai` | `werewolf` | savage | general | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Garou [savage age] |
| werewolf | `grondir` | `changingbreed` | savage | grondr | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Grondr [savage age] |
| werewolf | `mortal` | `mortal` | savage | general | haswillpower | 1 | Human [savage age] |
| werewolf | `khara` | `changingbreed` | savage | khara | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Khara [savage age] |
| werewolf | `naghaluu` | `changingbreed` | savage | naghaluu | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Naghaluu [savage age] |
| werewolf | `saksomaknami` | `changingbreed` | savage | saksomaknami | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Saksom Aknami [savage age] |
| werewolf | `wlewa` | `changingbreed` | savage | wlewa | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Wlewa [savage age] |
| vampire | `mortal` | `mortal` | modern | ghoul | haswillpower; hasvirtue; zasoby: bloodpool | 1 | Ghoul [modern] |
| vampire | `vampire` | `vampire` | modern | kindredeast | haswillpower; zasoby: yinchi/yangchi/demonchi | 1 | Kindred of the East [modern] |
| vampire | `mortal` | `mortal` | modern | general | haswillpower | 1 | Mortal [modern] |
| vampire | `vampire` | `vampire` | livinggods | general | haswillpower; hasvirtue; zasoby: bloodpool | 1 | Vampire [age of the living gods] |
| vampire | `vampire` | `vampire` | classical | general | haswillpower; hasvirtue; zasoby: bloodpool | 1 | Vampire [classical age] |
| vampire | `vampire` | `vampire` | darkages | general | haswillpower; hasvirtue; zasoby: bloodpool | 1 | Vampire [dark ages] |
| vampire | `vampire` | `vampire` | modern | general | haswillpower; hasvirtue; zasoby: bloodpool | 1 | Vampire [modern] |
| vampire | `vampire` | `vampire` | victorian | general | haswillpower; hasvirtue; zasoby: bloodpool | 1 | Vampire [victorian age] |
| werewolf | `mortal` | `mortal` | modern | kinfolk | haswillpower; hasgnosis | 1 | Kinfolk [modern] |
| werewolf | `mortal` | `mortal` | modern | general | haswillpower | 1 | Mortal [modern] |
| werewolf | `werewolf` | `werewolf` | darkages | general | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Werewolf [dark ages] |
| werewolf | `werewolf` | `werewolf` | modern | general | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Werewolf [modern] |
| werewolf | `werewolf` | `werewolf` | victorian | general | haswillpower; hasgnosis; hasrenown; zasoby: rage; shapeform | 1 | Werewolf [wild west] |
| wraith | `mortal` | `mortal` | modern | orpheus | haswillpower; zasoby: vitality/spite | 1 | Orpheus [modern] |
| wraith | `wraith` | `wraith` | modern | shadow | zasoby: angst | 1 | Shadow [modern] |
| wraith | `wraith` | `wraith` | modern | general | haswillpower; zasoby: pathos/corpus | 1 | Wraith [modern] |
Wzorce widoczne w danych (VERIFIED data):
- **Mortal nie jest linią, tylko Splatem w każdej linii.** 11 Splatów ma `id = mortal` pod różnymi `game` (vampire, werewolf, mage, changeling, demon, wraith). Śmiertelnik wampirzy i śmiertelnik zmiennokształtny mają inne Game i inny wygląd.
- **Hybrydy pochodzą z danych, nie z osobnego mechanizmu.** Ghoul = `mortal` + `bloodpool` + Virtues. Kinfolk = `mortal` + `gnosis`. Sorcerer = `mortal` + Quintessence. Enchanted = `mortal` + Glamour/Banality.
- **Ananasi ma Blood Pool zamiast Rage.** Spełnia więc warunek Augment Attributes (CAP-001). Czy to zgodne z zasadami Ananasi, rozstrzyga maintainer (DEC-011). Runtime NOT TESTED.
- **Kindred of the East nie ma Blood Pool ani Virtues** (ma Chi i Hun/Po). Augment Attributes jest dla nich niedostępne. To zgodne z warunkiem, ale #1492 dotyczy wampirów ogólnie.
- **Shadow (Wraith) nie ma Willpower ani umiejętności** (0 Ability, przewagi `angst`, `psychewillpower`).
- **Brak Splatów dla PC Creature i Spirit** (FND-007), choć oba są w `CONFIG.splat`.
- **Tylko Mummy ma niestandardowy tor zdrowia**: `incapacitated = 6` pól. Pozostałe 114 Splatów ma 7 × 1.
- **Wszystkie Splaty mają limity 5/5/5** dla atrybutów, umiejętności i mocy, więc FND-002 jest dziś utajony.

## Gdzie kod rozgałęzia się według wymiaru
Statyczny spis odwołań w `module/`, `templates/` i `wod.js` bez `migration.js` (grep, VERIFIED jako liczba, nie jako analiza semantyczna):

| Wymiar | Odwołania | Pliki | Uwagi |
| --- | --- | --- | --- |
| `settings.has*` | 346 | 27 | 46 różnych flag. W szablonach PC (`.hbs`) tylko 5: `hasspheres`, `hasshapes`, `hasrealms`, `hasapocalypticforms`, `hasgnosis`. Reszta w szablonach legacy (`.html`) |
| `settings.variant` | 156 | 36 | wartości z danych Splata. `CONFIG.variant` nie jest źródłem prawdy dla PC (FND-006) |
| typ aktora (`type == "PC"` itp.) | 170 | 44 | główny podział PC / legacy |
| `settings.variantsheet` | 111 | 19 | wygląd i typ kości |
| `settings.era` | 76 | 16 | dwa formaty (krótki i `wod.era.*`), resolver w `select/era.js` |
| `settings.splat` | 65 | 24 | reguły specjalne; podatne na FND-003 |
| `settings.game` | 28 | 10 | głównie fallback i prezentacja |
| `system.id == "<przewaga>"` | 27 | 5 | m.in. willpower, paradox, gnosis, quintessence, sfery |

Co to znaczy dla zmian: funkcja CAPABILITY-SPECIFIC dla PC powinna sprawdzać Item (jak Augment Attributes), a nie `settings.splat`. Funkcja GAME-SPECIFIC oparta na `settings.splat` wymaga testu Savage Age (REG-015) i wariantów Mortal danej linii.

## Nowe ustalenia D01
### FND-010 — przygotowanie danych PC jest asynchroniczne, a Foundry go nie czeka
- **Fakt (VERIFIED code):** `prepareData()` (`wod-actor-base.js:30-44`) wywołuje `this._prepareCharacterData(actorData)` bez `await`. Funkcja jest `async`, a pierwsze `await` ma w linii 199 (`_setAbilityMaxValue`). Wszystko po tej linii działa już po powrocie z `prepareData`: budowa `system.advantages`, wszystkie flagi `has*`, synchronizacja Corpus i Essence Pool. `prepareDerivedData()` (`:46`) jest też `async`, a ruch (`:67`) liczony jest po `await _handleWoundLevelCalculations`.
- **Kontrakt platformy (INFERRED):** Foundry wywołuje `prepareData`/`prepareDerivedData` synchronicznie i nie czeka na zwrócone Promise. Kodu Foundry V14 w tej iteracji nie czytano, więc to wniosek ze znanego API, nie z odczytu.
- **Kolejność (INFERRED z semantyki JS):** `super.prepareData()` wywołuje `prepareDerivedData` przed `_prepareCharacterData`. Kontynuacja obliczeń pochodnych startuje więc przed ustawieniem flag `has*` i `system.advantages` w tym samym cyklu.
- **Znaczenie:** wzmacnia RSK-003 Charona. Mechanizm jest potwierdzony w kodzie, ale efekt (np. karta wyrenderowana z poprzednimi lub domyślnymi flagami) to HYPOTHESIS do sprawdzenia w Foundry. Kod, który synchronicznie po `prepareData` czyta `system.advantages` albo `has*`, może dostać stan sprzed przeliczenia.

### FND-011 — przygotowanie danych zapisuje do bazy
- **Fakt (VERIFIED code):** `_prepareCharacterData` kończy się `this.updateEmbeddedDocuments("Item", itemList)` bez `await` (`wod-actor-base.js:591-593`). Lista obejmuje normalizację `max` umiejętności, przewag i mocy oraz synchronizację Essence Pool. `prepareData` nie sprawdza uprawnień.
- **Wniosek (INFERRED):** każdy klient, który przygotowuje aktora z niezgodnym `max`, wysyła żądanie zapisu. Przy kilku klientach mogą to być powtórzone, identyczne zapisy. U klienta bez prawa zapisu żądanie zostanie odrzucone. Zapis wywołuje kolejne przygotowanie, więc pętla kończy się dopiero, gdy wartości się zgodzą.
- **Znaczenie:** do SCN-018 (wielu klientów) i RSK-014. Zmiany dotykające `max`, generacji albo Essence mogą mieć skutki uboczne na każdym kliencie.

### FND-012 — obliczenia pochodne tylko u właściciela
- **Fakt (VERIFIED code):** `prepareDerivedData` kończy się od razu, gdy `actorData.permission < 3` (`wod-actor-base.js:55-57`).
- **Wniosek (INFERRED):** Observer i Limited nie liczą lokalnie ruchu ani poziomów ran. Widzą wartości zapisane w dokumencie albo wartości domyślne modelu. To, co widzą, może różnić się od karty właściciela.
- **Znaczenie:** SCN-019 i grupa Visibility (#1240, #1241, #1352). Ukrywanie pól nie jest jedyną różnicą między widokiem właściciela a obserwatora.

## Otwarte po D01
| ID | Temat | Warunek zamknięcia |
| --- | --- | --- |
| GAP-001 (reszta) | import paków do świata, compendia świata, zawartość features/powers poza Splatami | runtime albo eksport świata |
| GAP-010 (reszta) | pełne powiązanie każdej flagi `has*` z konsumentami | lista konsument → flaga → linia; częściowo w tabeli wyżej |
| GAP-014 | kolejność `prepareData`/`prepareDerivedData` i widoczny stan karty (FND-010) | test Foundry: zmiana przewagi i natychmiastowy render |
| DEC-011 | czy Augment Attributes ma działać dla Ananasi i Ghoula | decyzja maintenera |
