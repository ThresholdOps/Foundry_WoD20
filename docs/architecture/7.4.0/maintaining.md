# Utrzymanie aktualności mapy
## Zmiana wersji
1. Rozwiązać tag do SHA i zapisać czas odczytu. Oddzielić released tag, branch head i doc commit.
2. Porównać drzewa/commity względem poprzedniego baseline. Nie przenosić automatycznie statusów VERIFIED/PASS na nową wersję.
3. Powiązać zmienione ścieżki z CMP, DAT, CAP i SCN. Użyć odwrotnego grafu importów tylko jako przybliżenia; globalne odczyty, hooki, template i UUID wymagają osobnej analizy.
4. Oznaczyć dotknięte twierdzenia jako wymagające rewalidacji, zachowując poprzedni dowód i wersję. OUTDATED oznacza niesprawdzony stary dowód, nie automatycznie fałsz.
5. Ponownie wyciągnąć schematy i porównać pola/default/min/max oraz typy. [Ekstraktor](checks/extract-catalog.mjs) działa na zaufanych źródłach i atrapach deskryptorów.
6. Odświeżyć pełne strony milestone i komentarze; porównać numery, updated_at, stany i zakres. RELACJE wymagają przeglądu semantycznego, nie samego dopasowania słów.
7. Dobrać i wykonać testy dla zmienionych ścieżek; zweryfikować szczególnie role, PC/legacy, custom/hybrid i tokeny. Zaktualizować Discovery Status.

## Automatyczne a semantyczne
| Automatyzowalne | Wymaga analizy / runtime |
| --- | --- |
| tag/SHA, tree/blob hashes, wersje manifestów | znaczenie pola i źródło prawdy |
| typy i deklarowane schematy, importy | pełna zgodność Game/Era/Splat/capability |
| metadane issue, licznik stron i komentarzy | overlap, scope i decyzja wspólnej implementacji |
| uruchomienie istniejących testów, składnia | rzeczywiste uprawnienia i dostęp do danych |
| porównanie ścieżek i pól | synchronizacja, kolejność przeliczeń i UI refresh |

## Minimalny rekord wiedzy
id, baseline_sha, status, basis, evidence(path/symbol/line/test/issue), consumers, last_verified, gaps. Test osobno: test_id, command/scenario, environment, result, scope i limitations. discovery.json jest pierwszym uporządkowanym zbiorem; inventory.json to zachowany pierwotny snapshot.

Przed zmianą wskazać źródło danych, autorów zapisu, przeliczenie i odbiorców, uwarunkowania capability i scenariusz negatywny. Po zmianie aktualizować mapę razem z jej odbiorem. Proponowany wymóg aktualizacji dokumentacji w przyszłych PR pozostaje propozycją procesu, nie istniejącą regułą upstream.
