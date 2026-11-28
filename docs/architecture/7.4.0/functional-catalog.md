# D01 — Functional Capability Map
Wiedza o definicjach: VERIFIED(code/config). Pełna zgodność wszystkich kombinacji: UNKNOWN(runtime).

## Wymiary konfiguracji
| Wymiar | Reprezentacja | Co decyduje / ograniczenie |
| --- | --- | --- |
| Actor Type | template.json Actor.types + rejestracja kart | PC albo starszy typ, nie to samo co Game |
| Game | settings.game: StringField | kopiowany ze Splat; używany też do przycisków i prezentacji |
| Era | settings.era / Item.system.era | krótkie klucze i wod.era.*; resolver dla sprzętu |
| Splat | settings.splat, definicja Item Splat | identyfikator szablonu; nie wymusza wszystkich możliwości |
| Variant | settings.variant | wyjątki i warianty, m.in. shadow/spirit/earthbound |
| Presentation | settings.variantsheet, dicesetting, CSS i rola | wpływa na wybór wyglądu, części i ikon |
| Capability | Itemy/identyfikatory/grupy i has* | np. bloodpool, corpus, shapeform, spheres, chimerical |
| Settings | świat/klient + CONFIG | reguły rzutu, atrybuty, uprawnienia i grafika |

Dowody: [module/actor/datamodel/base/actor_settings.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/datamodel/base/actor_settings.js), [module/items/datamodel/spalt-item-datamodel.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/items/datamodel/spalt-item-datamodel.js), [module/scripts/drop-helpers.js:803](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/drop-helpers.js#L803), [module/actor/template/pc-actor-sheet.js:995](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/template/pc-actor-sheet.js#L995), [module/scripts/select/era.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/select/era.js).
Pola da się zapisać osobno, lecz kod łączy je warunkami i przy instalacji kopiuje z jednego Splat. Nie oznacza to wsparcia iloczynu wszystkich Game × Era × Variant.

## Katalog deklaracji
| Katalog | Wartości |
| --- | --- |
| Actor Type (13) | `PC`, `Changeling`, `Changing Breed`, `Creature`, `Demon`, `Exalted`, `Hunter`, `Mage`, `Mortal`, `Mummy`, `Vampire`, `Wraith`, `Werewolf` |
| Item Type (16) | `Splat`, `Ability`, `Advantage`, `Sphere`, `Realm`, `Armor`, `Bonus`, `Experience`, `Feature`, `Fetish`, `Item`, `Melee Weapon`, `Ranged Weapon`, `Power`, `Rote`, `Trait` |
| Splat keys (13) | `vampire`, `werewolf`, `mage`, `changeling`, `hunter`, `demon`, `wraith`, `mummy`, `exalted`, `mortal`, `creature`, `changingbreed`, `spirit` |
| Era (6) | `modern`, `victorian`, `darkages`, `classical`, `livinggods`, `savage` |

**Pułapka katalogu:** config.sheettype zawiera Spirit, ale Spirit nie jest typem Actor z template.json i nie ma osobnej rejestracji karty w wod.js. Duch jest obsługiwany przez warianty/konstrukcje postaci. Sam wpis w słowniku nie jest dodatkowym typem dokumentu.
Dowody: [module/config.js:3](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/config.js#L3), [template.json](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/template.json), [wod.js:219](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/wod.js#L219).

### Warianty słownika (47)
| Rodzina | Klucze |
| --- | --- |
| vampire | `kindredeast` |
| changeling | `dauntain`, `thallain`, `nunnehi`, `menehune`, `inanimae`, `darkkin` |
| wraith | `shadow` |
| exalted | `solar`, `lunar`, `dragon`, `sidereal`, `abyssal`, `infernal`, `alchemical`, `liminal` |
| changingbreed | `Ajaba`, `Ananasi`, `Bastet`, `Corax`, `Gurahl`, `Kitsune`, `Mokole`, `Nagah`, `Nuwisha`, `Ratkin`, `Rokea`, `Apis`, `Camazotz`, `Grondr` |
| mortal | `orpheus`, `sorcerer`, `autumnpeople`, `enchanted`, `ghoul`, `kinfolk`, `truefaith` |
| creature | `chimera`, `familiar`, `construct`, `spirit`, `warwolves`, `anurana`, `samsa`, `kerasi`, `yeren`, `earthbound` |

To lista z config.variant, nie inwentarz wszystkich Splatów, klanów, tradycji ani form z compendiów. Faktyczne szablony i ich UUID: GAP-001.

## Capability Compatibility Matrix — warunki, nie etykiety
| ID | Funkcja / klasyfikacja | Warunek i odbiorcy | Przypadek negatywny / stan |
| --- | --- | --- | --- |
| CAP-001 | Augment Attributes / CAPABILITY-SPECIFIC | PC owner + widoczny Advantage bloodpool; earthbound wykluczony | bez zasobu/bez owner: brak zwiększania; istniejące zarządzane premie umożliwiają sprzątanie; helper i popup testowane |
| CAP-002 | Corpus health / CAPABILITY-SPECIFIC | Advantage corpus; osobna obsługa legacy Wraith | zwykły tor zdrowia bez Corpus; testy health PASS |
| CAP-003 | Chimerical / CAPABILITY-SPECIFIC | settings.usechimerical i osobne damage/soak | zwykła postać bez drugiego toru; różnicowanie Bonusów nadal osobnym wymaganiem #1468 |
| CAP-004 | Forms / CAPABILITY-SPECIFIC | Trait shapeform, aktywność i konfiguracja; niektóre reguły sprawdzają splat=werewolf | custom/hybrid nie dziedziczy automatycznie wszystkich reguł Garou; runtime NOT TESTED |
| CAP-005 | Standard roll / GENERIC | wybrana cecha, pula i settings; wejście bez aktora także istnieje | Actor PC/legacy, pusta cecha; wybrane testy puli i silnika PASS |
| CAP-006 | Arete casting / GAME-SPECIFIC | dialog-aretecasting i dane maga | zwykły PC bez Arete; pełny dialog runtime NOT TESTED |
| CAP-007 | Bio visibility / PRESENTATION | typ widza i flagi pól | GM/owner oraz limited/observer oddzielnie; helper testowany, transport danych UNKNOWN |
| CAP-008 | Era equipment / ERA-SPECIFIC | resolveWeaponEra normalizuje dane | pusta/nieznana era → fallback modern; tabela klas w JSON |
| CAP-009 | Splat reset / SPLAT-SPECIFIC | akcja removeSplat na odblokowanej PC + potwierdzenie | anulowanie; reset Itemów potwierdzony w kodzie, UI NOT TESTED |
| CAP-010 | Public API / CAPABILITY-SPECIFIC | actor.type=PC | legacy: getter zwraca undefined |
| CAP-011 | Layout / PRESENTATION | grupy Advantages oraz sortowanie zlokalizowanych nazw | hybrydy mają wiele grup; #1359 i #1394 nie są zmianami reguł |
| CAP-012 | Special rules / GAME-SPECIFIC | Torment/Lore, rage, generation itd. w wielu warstwach | negatywny test innej linii; pełny wykaz warunków do uzupełnienia |

Źródła warunków: [module/ui/attribute-augmentation-popup.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/ui/attribute-augmentation-popup.js), [module/scripts/attribute-augmentation-helpers.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/attribute-augmentation-helpers.js), [module/scripts/health.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/health.js), [module/scripts/combat-helpers.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/scripts/combat-helpers.js), [module/actor/api-handler.js](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/api-handler.js), [module/actor/template/pc-actor-sheet.js:1096](https://github.com/JohanFalt/Foundry_WoD20/blob/32e360a6953d41685bc605ba2cc68e9998b2f9b8/module/actor/template/pc-actor-sheet.js#L1096).

## Ograniczenia D01
Game/era/splat katalog wyprowadzony z kodu jest kompletny tylko dla wymienionych słowników i typów. Rzeczywista zawartość compendiów, custom templates i hybrydy nie są certyfikowane. Nie utożsamiać labelki game z pełnym wsparciem zasad podręcznika.
