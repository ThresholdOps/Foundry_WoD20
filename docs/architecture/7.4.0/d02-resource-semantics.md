# D02 — semantyka zasobów i Source of Truth Register (iteracja 2)

Baseline `32e360a6953d41685bc605ba2cc68e9998b2f9b8`. Uzupełnia [data-model.md](data-model.md) Charona (DAT-001–020 pozostają ważne). Ten plik odpowiada na wymaganie D02: Blood Pool, Rage, Gnosis, Willpower, Quintessence, Pathos, Glamour i Essence mają wspólną strukturę danych, ale nie mają wspólnej semantyki.

## Werdykt
**Wspólna jest tylko struktura.** Każdy zasób PC to Item `Advantage` z polami `permanent`, `temporary`, `max`, `roll` i `perturn` oraz pięcioma flagami. To flagi i reguły przypisane do `system.id` decydują, co pole znaczy. Trzy zasoby mają **pojemność wyliczaną i zapisywaną przy każdym przygotowaniu danych**, więc ich `max` jest pamięcią podręczną, a nie źródłem prawdy:

| Zasób | Źródło prawdy dla `max` | Dowód |
| --- | --- | --- |
| Blood Pool | `bio.splatfields.generation.value − .mod` → tabela generacji | `wod-actor-base.js:398-418`, `:1120-1186` |
| Paradox | `max` przewagi Quintessence | `wod-actor-base.js:425-436` |
| Essence Pool | wariant Exalted + `essence.permanent` | `wod-actor-base.js:1666-1716` |
| Willpower (tryb 5th) | `composure + resolve`, ograniczone `max` | `wod-actor-base.js:286-330` |

Co to znaczy: **bonus do `max` tych zasobów (#1447) zostanie nadpisany przy następnym przygotowaniu danych.** Normalizacja nie zna premii. Każde rozszerzenie pojemności musi wejść do funkcji normalizującej albo do jej wejścia (np. generacji), a nie do pola `max`.

## Wspólny model Advantage
Flagi z `advantage-item-datamodel.js` i ich znaczenie w kodzie (VERIFIED code: `wod-item-base.js:283-311`, `action-helpers.js:980-990`, `wod-actor-base.js:286-330`):

| Flaga | Znaczenie operacyjne |
| --- | --- |
| `usepermanent` | pole `permanent` jest używane i wyświetlane |
| `usetemporary` | pole `temporary` jest używane (stan bieżący zasobu) |
| `useroll` | przewaga ma wartość do rzutu `roll` |
| `highertemporary` | `temporary` może przekroczyć `permanent`. Bez tej flagi kliknięcie i normalizacja przycinają `temporary` do `permanent` |
| `usebothrolls` | `roll = permanent + temporary` (Paradox) |

Wyliczanie `roll` przy `usepermanent && usetemporary` zależy od ustawienia świata `rollSettings`: `true` → `roll = permanent`, `false` → `roll = min(permanent, temporary)`. `roll` jest więc **wartością pochodną zależną od ustawień świata**, nie od samego Itemu.

## Katalog zasobów z compendium
Źródło: pak `advantages` (VERIFIED data). P/T/R = `usepermanent`/`usetemporary`/`useroll`, hiT = `highertemporary`. `—` = brak wartości w danych paku, model uzupełnia `false` (INFERRED z `initial: false` w DataModel).

| `system.id` | Item | P/T/R | hiT | `max` w paku | Reguła specjalna w kodzie PC | Linie (z katalogu Splatów) |
| --- | --- | --- | --- | --- | --- | --- |
| `bloodpool` | Bloodpool [10] | –/T/– | — | 10 | `max` i `perturn` z generacji; `temporary` przycinane i zapisywane | Vampire (5 epok), Ghoul, Ananasi |
| `willpower` | Willpower | P/T/R | — | 10 | tryb 5th: `permanent = composure + resolve` (bez wariantu `spirit`) | prawie wszystkie |
| `rage` | Rage | P/T/R | ✓ | 10 | `temporary > permanent` dozwolone | Garou, Fera |
| `gnosis` | Gnosis | P/T/R | — | 10 | ustawia `hasgnosis` | Garou, Fera, Kinfolk |
| `quintessence` | Quintessence [Mage] / [Sorcerer] | –/T/– | – | 20 / 10 | wyznacza `max` Paradoxu; suma Q + P(temp) + P(perm) ≤ `max`, nadmiar zdejmowany najpierw z Q | Mage, Sorcerer |
| `paradox` | Paradox | P/T/R | ✓ | 20 | `usebothrolls`; `max` kopiowany z Quintessence | Mage |
| `pathos` | Pathos | –/T/– | – | 10 | brak | Wraith |
| `corpus` | Corpus | P/T/– | – | 10 | osobny tor obrażeń (`_handleWraithCalculations`) | Wraith |
| `glamour` | Glamour | P/T/R | – | 10 | brak | Changeling, Enchanted |
| `banality` | Banality | P/T/R | ✓ | 10 | brak | Changeling, Enchanted, Mortal (Changeling) |
| `essence` | Essence | P/–/– | – | 5 | `roll = permanent` (synchronizacja) | Exalted |
| `essencepool` | Essence pool | –/T/– | – | 10 | `max`, `perturn` z wariantu i Essence; `temporary` przycinane | Exalted |
| `faith` | Faith / Faith potential / True Faith / Faith score | różne | – | 10 / 5 / 10 / 10 | **cztery Itemy z tym samym `id`** | Demon, Mortal |
| `conviction` | Virtue - Conviction / Conviction | P/–/R vs P/–/– | – | 5 / 10 | **dwa Itemy z tym samym `id`, inna grupa** | Demon (virtue), Hunter |
| `sekhem` | Sekhem | P/T/– | ✓ | 10 | brak | Mummy |

## Nowe ustalenia D02
### FND-014 — pojemność części zasobów jest pochodna i nadpisywana
- **Fakt (VERIFIED code):** dla Blood Pool, Paradox, Essence Pool i Willpower (tryb 5th) `_prepareCharacterData` porównuje zapisany `max`/`perturn`/`temporary` z wartością wyliczoną i przy różnicy dodaje zapis do `itemList` (wysyłany bez `await`, FND-011).
- **Wniosek (INFERRED):** to są pola z **dwoma autorami zapisu**: użytkownik (kropki, edycja Itemu) i normalizacja. Normalizacja wygrywa przy każdym przygotowaniu. Ręczna zmiana `max` Blood Pool u wampira z generacją wraca do wartości z tabeli.
- **Konsekwencja dla #973:** tabela generacji to `_calculteMaxBlood` (`:1120-1161`). Dziś: 14. → 8, 15. → 6, 16. → 4. Zmiana tego zachowania to jedna funkcja plus decyzja, jak oddać ograniczenie wydawania z komentarzy issue (DEC-010). Nowy mechanizm zasobów nie jest potrzebny.
- **Konsekwencja dla #1447:** premia do wartości przewagi musi być uwzględniona w normalizacji, inaczej zniknie. To mocny argument, by #1447 zaczął od decyzji, czy premia dotyczy pojemności (`max`), stanu (`temporary`), czy wartości do rzutu (`roll`). To DEC-007 Charona.
- **Przycinanie jest trwałe:** gdy pojemność spada (np. zmiana generacji), nadwyżka `temporary` jest kasowana zapisem, a nie ukrywana. Powrót pojemności nie przywraca punktów.

### FND-015 — ten sam `system.id` dla różnych zasobów
- **Fakt (VERIFIED data):** pak `advantages` ma cztery Itemy z `id = faith` (Faith, Faith potential, True Faith, Faith score) o różnych `max` i flagach oraz dwa z `id = conviction` (Virtue - Conviction, grupa `virtue`, `max` 5; Conviction łowcy, bez grupy, `max` 10).
- **Fakt (VERIFIED code):** PC buduje `system.advantages` jako obiekt kluczowany `slug ?? id ?? name` (`wod-actor-base.js:265`). Dwie przewagi o tym samym `id` na jednej postaci nadpiszą się w tym obiekcie. Ostatnia wygrywa.
- **Wniosek (INFERRED):** w dostarczonych Splatach kolizja nie występuje (każdy Splat ma co najwyżej jeden Item danego `id`). Może jednak wystąpić przy hybrydzie (np. Thrall + True Faith) albo przy ręcznym dodaniu. Kod sprawdzający `system.id === "conviction"` nie odróżni cnoty Demona od zasobu łowcy.
- **Ryzyko:** RSK-016.

### FND-016 — `roll` zależy od ustawienia świata
- **Fakt (VERIFIED code):** przy `usepermanent && usetemporary && !usebothrolls` wartość `roll` to `permanent` albo `min(permanent, temporary)` w zależności od `CONFIG.worldofdarkness.rollSettings` (`wod-item-base.js:291-303`).
- **Konsekwencja:** premia do puli przewagi (#1446) musi określić, czy działa na `roll` po tej decyzji, czy osobno. Zmiana ustawienia świata zmienia wartość rzutu wszystkich takich przewag bez zmiany danych postaci.

## Source of Truth Register — uzupełnienie
| ID | Wartość | Źródło prawdy | Kopia / cache | Autorzy zapisu | Odbiorcy |
| --- | --- | --- | --- | --- | --- |
| SOT-001 | pojemność Blood Pool (PC) | generacja w `bio.splatfields.generation` | `Advantage[bloodpool].max`, `.perturn` | normalizacja `_prepareCharacterData`; użytkownik (nadpisywany) | karta, Augment Attributes, wydawanie |
| SOT-002 | stan Blood Pool | `Advantage[bloodpool].temporary` | — | kropki, augmentacja (bez kosztu), normalizacja (przycięcie) | karta, popup |
| SOT-003 | pojemność Paradox | `Advantage[quintessence].max` | `Advantage[paradox].max` | normalizacja | koło Quintessence/Paradox |
| SOT-004 | Willpower permanent (tryb 5th) | `attributes.composure.value + resolve.value` | `Advantage[willpower].permanent`, `.roll` | normalizacja | rzuty, wydawanie WP |
| SOT-005 | Essence Pool | wariant + `Advantage[essence].permanent` | `Advantage[essencepool].max`, `.perturn` | `_syncExaltedEssencePool` | karta Exalted |
| SOT-006 | wartość do rzutu przewagi | `permanent`/`temporary` + flagi + `rollSettings` świata | `Advantage.roll` | `WoDItem` przy przygotowaniu/aktualizacji | dialogi rzutów, `actor.api.rollAdvantage` |
| SOT-007 | capability PC | obecność widocznych Itemów | `settings.has*` | `_prepareCharacterData` (co przygotowanie), instalacja Splata | karta, dialogi (FND-013) |
| SOT-008 | `system.abilities` / `system.advantages` PC | osadzone Itemy | obiekty w `system` | `_prepareCharacterData` (nietrwałe) | karta, rzuty, API; kolizja kluczy FND-015 |
| SOT-009 | linia/wygląd | `settings.variantsheet` (wygląd), `settings.splat` (reguły) | — | instalacja Splata, ustawienia karty | `getSplat`, reguły specjalne (FND-003) |

## Otwarte po D02
| ID | Temat | Warunek zamknięcia |
| --- | --- | --- |
| GAP-002 (reszta) | field → writer → consumer dla premii (Bonus), zdrowia i soak w pełnym zakresie | dalsza iteracja D02/D03; Charon ma główną ścieżkę atrybutu |
| GAP-015 (zamknięta w tej iteracji) | które Splaty mają pole `generation` | VERIFIED(data): tylko 5 Splatów `vampire` (bez Kindred of the East). Ghoul i Ananasi go nie mają, więc ich Blood Pool nie jest normalizowany i zachowuje `max` 10 z paku. Pole przychodzi puste (`value: ""`), więc nowy wampir bez wpisanej generacji dostaje 10/1 (INFERRED: `"" − mod` daje NaN, a tabela ma wartość domyślną 10) |
| DEC-007 (wzmocniona) | znaczenie bonusu wartości przewagi | FND-014: premia do `max` bez zmiany normalizacji nie przetrwa |
| DEC-010 (wzmocniona) | Blood Pool wysokich generacji | FND-014: zmiana dotyczy `_calculteMaxBlood` i decyzji o ograniczeniu wydawania |
