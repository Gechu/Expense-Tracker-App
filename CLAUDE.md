# Ledger

Osobista aplikacja do finansów ("Ledger"). Interfejs w języku polskim. Backend FastAPI + Postgres, frontend React + TypeScript + Vite.

## Stack

- **Backend**: FastAPI, SQLAlchemy, Alembic (migracje), Postgres 16 (Docker Compose, `docker-compose.yml`), auth ciasteczkowe (bcrypt + PyJWT).
  - `backend/app/main.py` - wejście aplikacji
  - `backend/app/routers/` - `auth.py`, `tabs.py`, `widgets.py`, `fx.py`
  - `backend/app/models.py`, `schemas.py`, `service.py`, `security.py`, `deps.py`, `config.py`, `database.py`
- **Frontend**: React 19 + TypeScript + Vite 8, bez dodatkowej biblioteki CSS (własny `styles/theme.css`), ikony `lucide-react`, routing `react-router-dom`.
  - `frontend/src/pages/` - `AuthPage.tsx`, `AppPage.tsx` (główny widok)
  - `frontend/src/components/` - `Sidebar.tsx`, `TabModal.tsx`, `WidgetCard.tsx`, `WidgetSettingsModal.tsx`, `AddFieldModal.tsx`, `EntryModal.tsx`, `FieldsMasonry.tsx`, `FormulaBuilder.tsx`, `CurrencySelect.tsx`, `RateField.tsx`, `DragGhost.tsx`, `ThemeToggle.tsx`
  - `frontend/src/hooks/useDragReorder.ts` - generyczny hook przeciągania (patrz niżej)
  - `frontend/src/api/` - `client.ts` (fetch wrapper, `API_URL = http://localhost:8000`), `auth.ts`, `tabs.ts`, `widgets.ts`, `fx.ts`

## Model danych (skrót)

Użytkownik ma wiele **zakładek** (`Tab`: nazwa, kolor, pozycja), każda zakładka ma wiele **pól/widgetów** (`Widget`): typy `single_value`, `table`, `currency`, `formula`. Pole `currency` i `formula` mają `config` (JSON) do ustawień (np. kurs waluty, tokeny formuły). Pole `table` ma wpisy (`WidgetEntry`).

## Konwencje pracy

- **Cały UI po polsku**, w tym komentarze w kodzie dot. nietrywialnych decyzji (komentarze tylko tam, gdzie "dlaczego" nie jest oczywiste - bez opisowych komentarzy).
- Użytkownik akceptuje pragmatyczne, proste rozwiązania ("nic skomplikowanego") - unikać nadmiernej abstrakcji.
- **Zawsze testować realnie w przeglądarce przed zgłoszeniem "gotowe"**, zwłaszcza UI/mobile.
- **Dev server / Vite HMR bywa niestabilny w tej sesji** - jeśli po edycji coś nie działa mimo poprawnego kodu (błędy JSX-parse, "stare" zachowanie), otwórz **świeżą kartę** przeglądarki i przejdź do `http://localhost:5173` zamiast debugować dalej - to najczęściej rozwiązuje problem.
- **Sesja logowania nie przetrwa pełnego przeładowania strony** w środowisku testowym (ciasteczko ginie przy `navigate`) - po każdym pełnym reloadzie trzeba zalogować się ponownie.
- **`requestAnimationFrame` bywa mocno throttlowany/niemiarowy** w automatyzowanej przeglądarce testowej (Claude Browser pane) nawet gdy karta jest "visible" - testy logiki opartej o rAF (np. drag-and-drop) lepiej weryfikować realnym przeciągnięciem myszą (`computer` tool, `left_click_drag`) niż syntetycznymi `dispatchEvent(PointerEvent)` w pętli z `setTimeout` - te potrafią dawać fałszywe negatywy.
- Dane testowe (zakładki/pola) wygodnie tworzyć/usuwać przez bezpośrednie `fetch` do `http://localhost:8000/...` z konsoli przeglądarki (szybsze niż klikanie przez UI).
- Test przeciągania **persystuje do bazy** - powtórzenie tego samego przeciągnięcia dwa razy z rzędu bez resetu danych cofa zmianę i daje mylący wynik "nic się nie zmieniło".

## Historia commitów

```
6d2af47 Initial commit
8129001 Bootstrap FastAPI backend and Vite frontend
a6954f1 Add cookie-based auth and React auth pages
1abe203 Add tab/widget data model and API
8b5eaf2 Unify auth UI and add theme system
c33eb14 Add tab sidebar and management modal
ecd9507 Add widget field management UI and API
0eacb12 Add formula and currency widget UI
f51a5c2 Add FX rate fetch API and currency UI controls
1514e0e Add token-based formula builder and evaluator
cb7f866 Improve modal UX and formula input validation
6949357 Add masonry layout and widget drag reordering
7ec74ed Add edit mode with pointer drag reordering   <- patrz szczegóły niżej
```

### `7ec74ed` - "Add edit mode with pointer drag reordering" (szczegóły, nigdy wcześniej nie zapisane)

Duży, wieloetapowy commit obejmujący cały tryb edycji układu:

1. **Ujednolicenie ustawień pól** - zębatka (ustawienia w modalu) zostaje tylko dla `formula`/`currency`; dla `single_value`/`table` nazwę edytuje się inline w trybie edycji (ikona kosza do usuwania też inline).
2. **Naprawa z-index** modala nad mobilnym menu hamburgerowym - rozdzielenie `.scrim` (modale, z-index 50) i `.nav-scrim` (tło menu mobilnego, z-index 35), oba poniżej `.rail.is-open` (z-index 40) tam gdzie trzeba.
3. **Sticky pasek górny na mobilnym** (`.mobile-topbar`) - przyciski (hamburger, edycja, dodaj pole) zawsze widoczne przy scrollu.
4. **Stały layout na desktopie** - `.shell` na `height:100vh; overflow:hidden`, scrolluje się tylko `.main-content` i niezależnie `.rail-tabs`; sidebar i nagłówek pozostają na miejscu. Lekko zmniejszony `.main-header`. Osobny override w media query dla mobile (przywraca zwykły scroll strony).
5. **Przełącznik trybu edycji przeniesiony** z menu hamburgerowego na stały przycisk (ołówek) w `.mobile-topbar`, dostępny bez otwierania menu.
6. **Pełne przejście z natywnego HTML5 Drag and Drop na Pointer Events** (`frontend/src/hooks/useDragReorder.ts`) - natywne DnD w ogóle nie działa na dotyku. Jeden hook obsługuje myszkę i dotyk jednocześnie, używany zarówno do przeciągania kafelków (`WidgetCard`) jak i zakładek (`Sidebar`/`TabRow`).
7. **"Duszek" (ghost) przeciąganego elementu** (`DragGhost.tsx`) - migawka `outerHTML` renderowana przez portal do `document.body`, podąża za kursorem/palcem, nie jest przycięta przez scrollowalne kontenery.
8. **Auto-scroll** najbliższego scrollowalnego kontenera (lub okna) przy krawędzi podczas przeciągania.
9. **Wydajność na mobile** - dwie poprawki po zgłoszeniu lagów: (a) `activeWidgets` zmemoizowane (`useMemo`) w `AppPage.tsx`, żeby `FieldsMasonry` nie przeliczał całego układu masonry przy każdej aktualizacji stanu przeciągania; (b) `handlePointerMove` w hooku tylko zapisuje pozycję do refa - cała kosztowna praca (hit-testing, autoscroll, pozycja duszka) liczona raz na klatkę animacji (`requestAnimationFrame`), a nie przy każdym surowym zdarzeniu dotyku.
10. **Revert edycji zakładek do modala** - próbne inline-edytowanie nazwy/koloru zakładki w `Sidebar` zostało wycofane na wyraźną prośbę użytkownika; wrócił pełny `TabModal` (nazwa + kolor + usuwanie), a zębatka otwierająca go jest widoczna tylko w trybie edycji.

### Niezacommitowane (stan na teraz)

- **`frontend/src/components/Sidebar.tsx`** - przeciąganie zakładki w otwartym menu mobilnym (`.rail`, leży nad pełnoekranowym `.nav-scrim`) teraz **anuluje się automatycznie**, gdy wskaźnik/palec wyjdzie poza granice szuflady (`.rail`) - wcześniej przeciąganie "żyło dalej" nad przyciemnionym tłem (duszek wisiał, bez możliwości zmiany kolejności, ale gest się nie kończył). Dodano `railRef` + wrapper `handleTabDragPointerMove`, który przy wyjściu poza `.rail` wywołuje `dragControls.handlePointerUp` zamiast `handlePointerMove`, kończąc przeciąganie bez reorderu. Nie dotyczy przeciągania kafelków (`WidgetCard`) ani zakładek na desktopie poza tym samym mechanizmem granic.
- **`frontend/src/pages/AppPage.tsx`** - z otwartym mobilnym menu (`.rail.is-open`) dało się dalej przewijać kafelki pod przyciemnionym tłem (`.nav-scrim` samo w sobie nie blokuje scrolla, bo na mobile scrolluje się cała strona - `.shell`/`.main-content` mają tam `overflow: visible`, patrz pkt 4 w `7ec74ed` wyżej). Dodano `useEffect` na `navOpen`, który na czas otwarcia menu ustawia `document.body.style.overflow = 'hidden'` (przywracając poprzednią wartość przy zamknięciu/odmontowaniu). Zweryfikowane w przeglądarce na 375px z 14 polami w zakładce - scroll strony faktycznie zablokowany przy otwartym menu, wraca po zamknięciu.
- **`frontend/src/components/WidgetCard.tsx`** - stopka pola `single_value` pokazywała `dodano {entry.entry_date}` (ręcznie wpisywana data wpisu z modala, patrz `EntryModal.tsx`) zamiast realnej daty ostatniej aktualizacji - jeśli ktoś zmienił tylko kwotę, nie ruszając pola "Data", stopka pokazywała starą datę mimo świeżego zapisu. `table`/`formula`/`currency` już wcześniej poprawnie pokazywały `widget.updated_at` (backend bumpuje to pole w każdym create/update entry, patrz `routers/widgets.py`) - ujednolicono `single_value` do tego samego wzorca (`zaktualizowano {widget.updated_at}`). Zweryfikowane w przeglądarce: wpis z `entry_date` sprzed 3 tygodni, stopka mimo to poprawnie pokazuje dzisiejszą datę.
- **Pigułki składników formuły w kolorze zakładki źródłowej, nie bieżącej** - w kafelku formuły (`WidgetCard.tsx`) i w pasku formuły podczas edycji (`FormulaBuilder.tsx`) pigułki pól były zawsze w kolorze zakładki, na której jest sama formuła (`color` prop), więc np. formuła "A+B" gdzie A i B są z innych, kolorowo odróżnialnych zakładek, wyglądała jednolicie w kolorze zakładki formuły - nie było widać skąd biorą się składniki. Lista wyboru pól pod spodem (`field-picker-row`) już wcześniej poprawnie kolorowała kropkę wg `field.tabColor`. Naprawiono oba miejsca: `WidgetCard.tsx` dostaje teraz `widgetColors` (mapa `widget_id -> kolor jego zakładki`, budowana w `AppPage.tsx` tak samo jak istniejące `widgetLabels`) i koloruje nią pigułki w widoku; `FormulaBuilder.tsx` używa `field?.tabColor` (już dostępnego w `referenceFields`) zamiast jednolitego `color` w swoim pasku formuły. Zweryfikowane w przeglądarce (3 zakładki różnych kolorów, formuła A+B) - pigułki w obu miejscach poprawnie przyjmują kolor swojej zakładki źródłowej.
- **Nazwy nie mieszczące się w kafelku/modalu (dwa niezależne miejsca)**:
  1. Tytuł pola na kafelku (`.field-title` w `theme.css`) miał `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`, ale jako dziecko flexa `.field-card-header` bez `flex`/`min-width:0` nigdy się realnie nie kurczył (domyślne `min-width:auto` flex-itemu = szerokość jego treści, ten sam mechanizm co opisany wyżej przy `.shell > main`) - długa nazwa po prostu rozpychała nagłówek kafelka zamiast się przycinać. Dodano `flex: 1; min-width: 0;` do `.field-title` - teraz wielokropek faktycznie działa.
  2. Selecty "Z waluty"/"Na walutę" (`CurrencySelect`, w `AddFieldModal.tsx` i `WidgetSettingsModal.tsx`) stały obok siebie po połowie szerokości wąskiego modala (460px, formularz waluty) - dłuższe nazwy walut (np. "Rand południowoafrykański", "Won południowokoreański") przycinały się w połowie słowa tuż przy strzałce selecta, bez wielokropka (natywny `<select>` w Chrome go tu nie stosuje). Zmieniono kontener obu selectów z rzędu (`flex-direction: row`, domyślnie) na kolumnę (`flex-direction: column`) w obu miejscach - każdy select dostaje pełną szerokość modala i wszystkie nazwy z listy się mieszczą. Zweryfikowane w przeglądarce na desktopie i 375px (najdłuższe nazwy z listy, brak przepełnienia - sprawdzone przez `scrollWidth` vs `clientWidth`).
  3. **Pigułki tokenów-pól w formule (`.token-field` w `theme.css`)** - to był właściwy przypadek, o który chodziło użytkownikowi (nie waluta z pkt. 2, mylnie zgłoszona wcześniej - zostaje jak jest). Klasa `.token-field` (używana i w `.token-strip` - widok gotowej formuły w `WidgetCard.tsx`, i w `.formula-strip` - budowanie formuły w `FormulaBuilder.tsx`) miała tylko `white-space: nowrap`, bez żadnego ograniczenia szerokości - długa nazwa pola (np. wieloznaniowa nazwa pola walutowego) rozpychała pigułkę do pełnej szerokości tekstu, a to z kolei pchało cały `.formula-strip`/modal do poziomego scrolla zamiast się zawinąć. Lista wyboru pól pod spodem (`.field-picker-name`) już wcześniej poprawnie miała `flex:1; min-width:0; text-overflow:ellipsis` - problem był tylko w samych pigułkach tokenów. Dodano `max-width: 200px; overflow: hidden; text-overflow: ellipsis;` do `.token-field` - działa jednym fixem w obu miejscach (widok i edycja), bo to wspólna klasa. Zweryfikowane w przeglądarce - kafelek formuły i modal ustawień z bardzo długą nazwą pola, oba przycinają się z wielokropkiem, bez poziomego scrolla modala.
