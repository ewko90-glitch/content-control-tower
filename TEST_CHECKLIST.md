# Inbox Checks

- Smoke test: login + authed API + inbox protected

## Checklist

- Inbox: operational inbox shows only actionable items
- Each inbox item has single clear CTA and link to context
- Items disappear from inbox when resolved (behavior to test)
- Empty inbox shows calm state and CTA to overview
# Active Workspace Selection - Test Checklist

## Manual Testing Guide

### Prerequisites
- Fresh database with migrations run
- App running with NodeJS dev server
- Test user created or using dev bypass (owner@demo.local)

### Test Scenarios

#### 1. Initial Login Flow
- [ ] Open app and navigate to `/login`
- [ ] Login with valid credentials
- [ ] Verify redirect to `/workspaces` page
- [ ] Verify header shows "Workspace: none" (no cookie set yet)
- [ ] Verify "Switch" button is NOT visible (only shown when workspace is active)

#### 2. Create First Workspace
- [ ] On `/workspaces` page, enter workspace name in "Utwórz nowy workspace"
- [ ] Click "Dodaj"
- [ ] Verify workspace is created and appears in list
- [ ] Verify workspace row shows role (OWNER)
- [ ] Verify "Switch" button now appears in header
- [ ] Refresh page (F5)
- [ ] Verify workspace remains active (cookie persisted)
- [ ] Verify header shows workspace name instead of "none"

#### 3. Workspace Switching via List Page
- [ ] Create second workspace via form
- [ ] Verify both workspaces appear in list
- [ ] Verify first workspace button is highlighted (primary variant) - indicates active
- [ ] Click second workspace button
- [ ] Verify page reloads
- [ ] Verify second workspace is now highlighted
- [ ] Verify header shows second workspace name
- [ ] Verify navigation to content/domains/calendar still works with correct workspace data

#### 4. Workspace Switching via Dropdown
- [ ] Click "Switch" button in header
- [ ] Verify dropdown appears
- [ ] Verify all user's workspaces listed with roles
- [ ] Verify current workspace is highlighted in blue
- [ ] Click different workspace in dropdown
- [ ] Verify page reloads
- [ ] Verify header shows new workspace name
- [ ] Click "Switch" again - verify dropdown closes
- [ ] Click outside dropdown - verify dropdown closes

#### 5. Access Control to Scoped Pages
- [ ] With workspace A active, click "Domains" link
- [ ] Verify only domains from workspace A shown
- [ ] Switch to workspace B
- [ ] Verify only domains from workspace B shown
- [ ] Create content in workspace A
- [ ] Switch to workspace B and verify content not visible
- [ ] Switch back to A and verify content is visible

#### 6. No Workspace Redirect
- [ ] Manually delete the "workspaceId" cookie (DevTools → Applications → Cookies)
- [ ] Try to navigate to `/content`
- [ ] Verify redirect to `/workspaces`
- [ ] Verify header shows "Workspace: none"
- [ ] Click workspace to select it
- [ ] Verify redirect back works

#### 7. Non-Existent Workspace
- [ ] Set workspaceId cookie to invalid/non-existent ID
- [ ] Refresh page
- [ ] Verify redirect to `/workspaces` occurs
- [ ] Workspace should be selectable again

#### 8. Multi-User Workspace
- [ ] Create workspace A as user 1
- [ ] Invite user 2 as EDITOR
- [ ] Login as user 2
- [ ] Verify workspace A appears in their workspace list
- [ ] Verify they can select it and access content
- [ ] Verify they cannot access the invitation form (requires OWNER role)

#### 9. Cookie Security
- [ ] Verify in DevTools → Application → Cookies that "workspaceId" cookie:
  - [ ] Has `HttpOnly` flag (cannot access from JS)
  - [ ] Has `SameSite: Lax` flag
  - [ ] Has correct path
- [ ] Attempt in console: `document.cookie` - verify workspaceId NOT visible
- [ ] Verify cookie sent in requests to API endpoints

#### 10. API Endpoint Tests (via curl or Postman)

##### GET /api/workspaces/list
```bash
# Authenticated request should return array of memberships
curl -H "Cookie: next-auth.session-token=<session>" \
  http://localhost:3000/api/workspaces/list
# Response: { memberships: [...] }
```

##### POST /api/workspaces/active
```bash
# Valid workspace
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<session>" \
  -d '{"workspaceId": "VALID_ID"}' \
  http://localhost:3000/api/workspaces/active
# Response: { success: true, workspaceId: "..." }
# Cookie should be set in response

# Invalid/unauthorized workspace
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<session>" \
  -d '{"workspaceId": "OTHER_USER_WORKSPACE_ID"}' \
  http://localhost:3000/api/workspaces/active
# Response: { error: "Access denied to this workspace" } (403)
```

#### 11. Edge Cases

##### 11a. Rapid Workspace Switching
- [ ] Click Switch dropdown
- [ ] Click multiple workspaces quickly
- [ ] Verify no errors or race conditions
- [ ] Verify final state is correct

##### 11b. Browser Back Button
- [ ] Switch to workspace A
- [ ] View some content
- [ ] Switch to workspace B
- [ ] Click browser back button
- [ ] Verify workspace stays B (cookie persists)

##### 11c. Open Multiple Tabs
- [ ] Open workspace A in tab 1
- [ ] Switch to workspace B in tab 1
- [ ] Refresh tab 2
- [ ] Verify tab 2 shows workspace B (shared cookie)

##### 11d. Logout and Login
- [ ] Login as user 1, select workspace A
- [ ] Logout
- [ ] Login as user 2 with different workspaces
- [ ] Verify user 2's workspaces shown
- [ ] Verify workspaceId cookie updated correctly

#### 12. UI/UX
- [ ] "Switch" button is not shown when no active workspace (on /workspaces page with no selection)
- [ ] "Switch" button is visible and clickable when workspace is active (all other pages)
- [ ] Dropdown positioning doesn't overflow screen
- [ ] Active workspace highlighted clearly in dropdown
- [ ] Workspace names and roles readable in dropdown
- [ ] Header layout doesn't break with long workspace names

### Performance Checklist
- [ ] Switching workspaces completes within 2 seconds
- [ ] Header renders without blocking (AppShell is Server Component)
- [ ] Dropdown populates quickly (API response < 1s)
- [ ] No unnecessary re-renders in WorkspaceSwitcher

### Security Checklist
- [ ] User cannot access workspaces they're not member of
- [ ] Verification happens server-side (POST /api/workspaces/active)
- [ ] Cookie is httpOnly and cannot be manipulated from client JS
- [ ] CSRF protection in place (Next.js handles by default)
- [ ] Session token required for all endpoints

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browser

### Known Limitations / Future Improvements
- [ ] Consider adding "recent workspaces" to top of dropdown for quick access
- [ ] Keyboard navigation in dropdown (Escape to close, Arrow keys to select)
- [ ] Loading state during workspace switch (add spinner)
- [ ] Toast notification on successful workspace switch
- [ ] Workspace avatar/icon in dropdown

---

## Domains CRUD - Extended Checklist

### Prerequisites (Domains)
- Workspace active and selected
- At least one workspace with EDITOR+ role
- Database migrated with slug/description fields

### Test Scenarios - Domains

#### 1. Domains Page Navigation
- [ ] Click "Domeny" in left navigation
- [ ] Verify header shows "Domeny"
- [ ] Verify description text: "Domeny pomagają uporządkować treści według marek, projektów, kampanii lub klientów."
- [ ] Switch workspaces and verify domains list updates correctly
- [ ] Only domains from active workspace should be shown

#### 2. Empty State
- [ ] In a workspace with no domains, verify empty state shows
- [ ] Empty state headline: "Brak domen"
- [ ] Empty state helper text: "Dodaj pierwszą domenę, aby zacząć porządkować treści w tym projekcie."
- [ ] Empty state contains "Dodaj domenę" button
- [ ] Click "Dodaj domenę" button

#### 3. Domain Creation
- [ ] Click "+ Dodaj domenę" button or from empty state
- [ ] Modal dialog opens with title "Dodaj nową domenę"
- [ ] Form has fields: Nazwa domeny, Identyfikator (URL), Opis
- [ ] Enter name: "Główna marka"
- [ ] Verify slug auto-generates as "glowna-marka"
- [ ] Verify slug can be edited
- [ ] Verify slug validation (only lowercase, numbers, hyphens, underscores)
- [ ] Enter description: "Zawiera treści głównej marki"
- [ ] Click "Utwórz"
- [ ] Modal closes
- [ ] Page reloads
- [ ] New domain appears in table
- [ ] Domain shows correct name, slug, description

#### 4. Domain Listing
- [ ] Domains displayed in table format
- [ ] Columns: Name (with slug), Description, Actions
- [ ] At least 3 example domains from seed visible
- [ ] Search box appears at top
- [ ] "Dodaj domenę" button visible in header

#### 5. Domain Search
- [ ] Type "główna" in search box
- [ ] Results filtered to matching domains
- [ ] Search works on name, slug, and description fields
- [ ] Clear search - all domains visible again
- [ ] Search for partial slug "marka" - matching domains appear
- [ ] Empty search results show: "Brak wyników dla „<query>""

#### 6. Domain Edit/Update
- [ ] In domains list, click "Edytuj" on a domain
- [ ] Modal opens with title "Edytuj domenę"
- [ ] Form pre-fills with current values
- [ ] Update name to "Premium marka"
- [ ] Slug auto-updates to "premium-marka" (or manually edit)
- [ ] Update description
- [ ] Click "Zapisz"
- [ ] Modal closes
- [ ] Changes persist - verify in table

#### 7. Slug Uniqueness (Per Workspace)
- [ ] Attempt to create two domains with same slug in same workspace
- [ ] Error message appears: "Identyfikator już exists w tym workspace."
- [ ] Try creating same slug in different workspace - should succeed
- [ ] Edit domain to use slug of existing domain in same workspace - error
- [ ] Edit domain to use its own slug + other field - success

#### 8. Domain Deletion with Confirmation
- [ ] Click "Usuń" button on a domain
- [ ] Delete confirmation dialog appears
- [ ] Dialog text: "Czy na pewno chcesz usunąć tę domenę? Tej operacji nie można cofnąć."
- [ ] Shows domain name being deleted
- [ ] Two buttons: "Anuluj" and "Usuń"
- [ ] Click "Anuluj" - dialog closes, domain still exists
- [ ] Click "Usuń" button again on same domain
- [ ] Dialog appears again
- [ ] Click "Usuń" (red button) - domain deleted
- [ ] Dialog closes
- [ ] Domain no longer appears in table
- [ ] Page reloads

#### 9. Workspace Isolation
- [ ] In Workspace A, create domain "Domain-A-1"
- [ ] Switch to Workspace B (from dropdown or /workspaces)
- [ ] Verify Workspace B's domain list is shown
- [ ] Verify "Domain-A-1" is NOT visible
- [ ] Create domain "Domain-B-1" in Workspace B
- [ ] Switch back to Workspace A
- [ ] Verify "Domain-A-1" is visible but not "Domain-B-1"

#### 10. Form Validation
- [ ] Try to submit form with empty name - field required (browser validation)
- [ ] Try to submit form with empty slug - field required
- [ ] Enter invalid slug with spaces or special chars
- [ ] Verify error: "Może zawierać tylko małe litery, cyfry, myślniki i podkreślenia"
- [ ] Invalid form doesn't submit
- [ ] Description is optional - submit with empty description succeeds
- [ ] Slug auto-generates from name with correct transformation

#### 11. Role-Based Access
- [ ] Login as OWNER, create domains - works
- [ ] Login as EDITOR, create domains - works
- [ ] Try as APPROVER:
  - [ ] Can view domains list
  - [ ] Can see edit/delete buttons (or not, depending on business rules)
  - [ ] (Future: Configure RBAC if needed)

#### 12. UI/UX Polish
- [ ] Table header readable (Name, Description, Akcje)
- [ ] Row hover effect visible (bg-gray-50)
- [ ] Action buttons properly aligned (right side)
- [ ] Modal dialog centered and styled consistently
- [ ] Empty state icon visible and clear
- [ ] Description helper text visible for each form field
- [ ] Slug generation happens real-time as user types name
- [ ] Loading states work (buttons show "Przetwarzanie...")
- [ ] Close button (✕) on modal works

#### 13. Mobile Responsiveness
- [ ] Domains page responsive on mobile viewport
- [ ] Table scrollable horizontally on small screens
- [ ] Buttons and inputs readable on mobile
- [ ] Modal dialog fits screen on mobile
- [ ] Search box usable on mobile

#### 14. Performance
- [ ] Page loads quickly with 10+ domains
- [ ] Search filtering responds instantly (client-side)
- [ ] Opening/closing modals smooth
- [ ] No console errors

### Edge Cases - Domains

#### 14a. Duplicate Names (Different Slugs)
- [ ] Create domain "Marka" with slug "marka"
- [ ] Create domain "Marka" with slug "marka-2"
- [ ] Both should exist (names CAN duplicate, only slugs must be unique)

#### 14b. Very Long Names/Descriptions
- [ ] Create domain with 100-char name
- [ ] Create domain with very long description
- [ ] Verify table displays without breaking layout

#### 14c. Special Characters in Name
- [ ] Try creating domain with name: "Marka & Partner's"
- [ ] Should create successfully
- [ ] Slug should handle special chars: "marka-partners"

#### 14d. Rapid Create/Delete
- [ ] Create domain, immediately delete it
- [ ] No race conditions or orphaned data

#### 14e. Modal Close Methods
- [ ] Open create modal
- [ ] Click X button - modal closes
- [ ] Modal cleared on reopen
- [ ] Open edit modal
- [ ] Click Anuluj/Cancel shown (if available) - closes
- [ ] Click outside modal (if click-outside enabled) - closes

#### 15. Polish Language 
- [ ] All user-facing labels in Polish:
  - [ ] "Domeny"
  - [ ] "Nazwa domeny"
  - [ ] "Identyfikator (URL)"
  - [ ] "Opis (opcjonalnie)"
  - [ ] "Utwórz" / "Zapisz" / "Edytuj" / "Usuń"
  - [ ] "Anuluj"
  - [ ] "Dodaj domenę"
  - [ ] "Brak domen"
- [ ] Helper texts in Polish
- [ ] Error messages in Polish

### Database / Data Integrity

#### 16. Data Persistence
- [ ] Create domain
- [ ] Refresh page - domain still exists
- [ ] Close browser, reopen - domain still exists
- [ ] Domain belongs to correct workspace
- [ ] Correct audit logs created (check if implemented)

#### 17. Cleanup
- [ ] After testing, verify all test domains can be deleted
- [ ] No data integrity constraints violated
- [ ] Can delete workspaces after removing all content

---

## Overview Dashboard (Przegląd) - Test Checklist

### Prerequisites (Overview)
- User logged in and workspace selected
- At least one workspace with active selection
- Domains already created for testing

### Test Scenarios - Overview Dashboard

#### 1. Dashboard Landing
- [ ] After login, user selects workspace
- [ ] Automatically redirects to `/overview` (not /workspaces)
- [ ] Header shows "Przegląd" and Polish subtitle
- [ ] Subtitle: "Widzisz najważniejsze rzeczy w tym projekcie — status, decyzje i najbliższe publikacje."
- [ ] Navigation "Przegląd" item is visible in left nav

#### 2. Quick Actions Section (3 buttons)
- [ ] "+ Dodaj treść" button visible and styled as primary (blue)
- [ ] "+ Dodaj domenę" button visible as secondary
- [ ] "📅 Zobacz kalendarz" button visible as secondary
- [ ] All buttons clickable and navigate correctly
- [ ] Buttons responsive on mobile (stack vertically)

#### 3. KPI Cards (3 cards)
- [ ] Card 1: "Domeny" shows count of domains in workspace
  - [ ] Shows correct number (e.g., 3)
  - [ ] Icon displayed (📁)
  - [ ] "Przejdź do domen →" link clickable, goes to /domains
- [ ] Card 2: "Treści do sprawdzenia" shows count (currently 0)
  - [ ] Shows 0 initially
  - [ ] Icon displayed (✓)
  - [ ] "Przejdź do sprawdzenia →" link goes to /inbox placeholder
- [ ] Card 3: "Publikacje w tym tygodniu" shows count (currently 0)
  - [ ] Shows 0 initially
  - [ ] Icon displayed (📅)
  - [ ] "Przejdź do kalendarza →" link goes to /calendar placeholder

#### 4. "Co wymaga uwagi" Section (Inbox Preview)
- [ ] Section title visible: "Co wymaga uwagi"
- [ ] Empty state shows:
  - [ ] Headline: "Na razie wszystko ogarnięte"
  - [ ] Message: "Gdy pojawią się treści do sprawdzenia lub decyzje, zobaczysz je tutaj."
  - [ ] Green checkmark icon visible
  - [ ] Button: "Przejdź do 'Do sprawdzenia'" → /inbox
- [ ] Button clickable and navigates to /inbox placeholder

#### 5. "Struktura projektu" Section (Domains Snapshot)
- [ ] Section title visible: "Struktura projektu"
- [ ] Shows list of up to 5 most recent domains:
  - [ ] Each domain shows 📁 icon + name
  - [ ] Domain description shown if available (smaller text)
  - [ ] Each domain is clickable, goes to /domains
- [ ] At bottom, show total count link: "Wszystkie domeny (N) →"
- [ ] Empty state if no domains:
  - [ ] Message: "Dodaj domeny, aby uporządkować treści"
  - [ ] Button: "Dodaj pierwszą domenę" → /domains create modal

#### 6. Workspace Isolation
- [ ] In Workspace A with 3 domains, view dashboard
  - [ ] KPI card shows "3"
  - [ ] Domains list shows all 3
- [ ] Switch to Workspace B with 1 domain
  - [ ] Dashboard redirects to /overview
  - [ ] KPI card shows "1"
  - [ ] Domains list shows only that 1 domain
- [ ] Switch back to Workspace A
  - [ ] Data resets to: 3 domains, etc.
- [ ] No cross-workspace data leakage

#### 7. Dynamic Updates
- [ ] On dashboard, navigate to /domains
- [ ] Create a new domain called "Test Domain"
- [ ] Go back to /overview
  - [ ] Domain count increased by 1
  - [ ] New domain appears in "Struktura projektu" (if within top 5)
- [ ] Delete the domain
- [ ] Return to /overview
  - [ ] Domain count decreased

#### 8. Placeholder Pages Verification (intentional, not 404)
- [ ] Navigate to /content
  - [ ] Page loads (not 404)
  - [ ] Header: "Treści"
  - [ ] Subheader: "Moduł tworzenia i zarządzania treściami"
  - [ ] Message: "Treści — w budowie"
  - [ ] Explanation of what will appear
  - [ ] Icon visible (document/edit icon)
  - [ ] Two buttons: "Wróć do Przeglądu" and "Przejdź do Domen"
  
- [ ] Navigate to /calendar
  - [ ] Page loads (not 404)
  - [ ] Header: "Kalendarz"
  - [ ] Subheader: "Plan publikacji i widok temporalny treści"
  - [ ] Message: "Kalendarz — w budowie"
  - [ ] Explanation visible (weekly/monthly view will appear)
  - [ ] Icon visible (calendar icon)
  - [ ] Navigation buttons work

- [ ] Navigate to /inbox
  - [ ] Page loads (not 404)
  - [ ] Header: "Do sprawdzenia"
  - [ ] Subheader: "Pendencies, zatwierdzenia i decyzje czekające na Ciebie"
  - [ ] Message: "Do sprawdzenia — w budowie"
  - [ ] Explanation (notifications, tasks, comments will appear)
  - [ ] Icon visible (inbox/message icon)
  - [ ] Navigation buttons work

#### 9. Polish Language Verification
- [ ] All section titles in Polish: "Przegląd", "Co wymaga uwagi", "Struktura projektu"
- [ ] All button labels in Polish
- [ ] All helper texts in Polish
- [ ] Dashboard subtitle entirely in Polish
- [ ] Placeholder pages entirely in Polish (headers, messages, buttons)

#### 10. UI/UX Polish
- [ ] Icons display clearly (emojis or SVG)
- [ ] Cards have consistent styling and spacing
- [ ] Links are obvious and underlined/colored
- [ ] Buttons have hover effects
- [ ] Layout is clean and uncluttered
- [ ] Empty states feel intentional and friendly
- [ ] No broken links or navigation

#### 11. Navigation Integration
- [ ] "Przegląd" appears first in left navigation
- [ ] All nav items in Polish: Przegląd, Workspaces, Domeny, Treści, Kalendarz, Do sprawdzenia
- [ ] Current page highlighted in nav
- [ ] Clicking nav items works
- [ ] Can switch between dashboard and other pages seamlessly

#### 12. Mobile Responsiveness
- [ ] Dashboard responsive on mobile viewport (320px+)
- [ ] Quick action buttons stack vertically on mobile
- [ ] KPI cards stack vertically on mobile
- [ ] Content section responsive
- [ ] Domains section responsive
- [ ] Text readable, not cramped

#### 13. Performance
- [ ] Dashboard loads quickly (domain count + recent domains query)
- [ ] KPI numbers displayed instantly
- [ ] No console errors
- [ ] Page doesn't flicker on load

#### 14. Role-Based Access
- [ ] OWNER can view dashboard ✓
- [ ] EDITOR can view dashboard ✓
- [ ] APPROVER can view dashboard ✓
- [ ] All see same data (workspace-scoped)

#### 15. Edge Cases
- [ ] Dashboard with 0 domains - empty state shows correctly
- [ ] Dashboard with 100+ domains - pagination/truncation works (shows 5 + "view all" link)
- [ ] Domain names with special characters display correctly
- [ ] Very long domain names truncate with ellipsis
- [ ] Switching between workspaces rapidly - no race conditions

#### 16. Redirect Flow Verification
- [ ] Login → /workspaces
- [ ] Create workspace → redirects to /overview (not back to /workspaces)
- [ ] Select existing workspace → redirects to /overview (not just reloads)
- [ ] Switch workspace via dropdown → redirects to /overview with new data
- [ ] Bookmark /overview and refresh → stays on /overview with correct workspace



---

## Sites Management (Strony) - Test Checklist

### Prerequisites (Sites)
- User logged in and workspace selected
- At least one workspace with OWNER role (edit/delete requires OWNER)
- Database migrated with Site model

### Test Scenarios - Sites

#### 1. Navigate to Sites Page
- [ ] Click "Strony" in left navigation
- [ ] Verify page loads at `/sites`
- [ ] Verify header shows "Strony"
- [ ] Verify description: "Dodaj miejsca publikacji (WordPress, Shopify lub inne) dla tego projektu."
- [ ] Switch workspaces and verify sites list updates
- [ ] Only sites from active workspace shown

#### 2. Empty State
- [ ] In workspace with no sites, verify empty state shows
- [ ] Headline: "Brak stron"
- [ ] Text: "Dodaj pierwszą stronę, aby później planować publikacje w konkretnych miejscach."
- [ ] Contains "Dodaj stronę" button

#### 3. Site Creation - Full Form
- [ ] Click "+ Dodaj stronę" button
- [ ] Modal opens with title "Dodaj nową stronę"
- [ ] Form fields: Nazwa, Typ, Adres strony, Status, Notatki
- [ ] Enter: Name="PanPrecel.pl", Type="WordPress", URL="https://panprecel.pl"
- [ ] Status="Aktywna", Notes="Główna strona"
- [ ] Click "Dodaj stronę"
- [ ] Site appears in table with all fields

#### 4. Site Types (WordPress, Shopify, Other)
- [ ] Create WordPress site - shows optional WordPress credential fields
- [ ] Create Shopify site - shows optional Shopify credential fields
- [ ] Create Other site - no conditional fields
- [ ] Type badges display correctly in table

#### 5. Site Listing Table
- [ ] Columns: Nazwa, Typ, Adres, Status, Ostatnia aktualizacja, Akcje
- [ ] URL is clickable link (opens in new tab)
- [ ] Status badge: Aktywna(green), Nieaktywna(red)
- [ ] Edit/Delete buttons on each row

#### 6. Search Filtering
- [ ] Search by name: "PanPrecel" filters correctly
- [ ] Search by type: "WordPress" filters correctly
- [ ] Search by URL: partial URL matches
- [ ] Clear search shows all sites

#### 7. Site Edit
- [ ] Click "Edytuj" on a site
- [ ] Modal pre-fills all fields
- [ ] Change name, status, notes
- [ ] Click "Zaktualizuj stronę"
- [ ] Changes persist

#### 8. Site Delete
- [ ] Click "Usuń" on a site
- [ ] Delete dialog appears with site name
- [ ] Message: "Czy na pewno chcesz usunąć tę stronę? Tej operacji nie można cofnąć."
- [ ] Click "Usuń" - site deleted
- [ ] Click "Anuluj" - cancel deletion

#### 9. URL Validation
- [ ] Invalid URL shows error: "Adres strony musi być poprawnym URL."
- [ ] Valid URLs: https://example.com, https://sub.example.com
- [ ] Empty URL rejected

#### 10. Name Validation
- [ ] Empty name shows error: "Nazwa strony jest wymagana."
- [ ] Duplicate name in same workspace shows error
- [ ] Can create duplicate name in different workspace
- [ ] Special characters allowed: "Marka & Co."

#### 11. Workspace Isolation
- [ ] Create site in workspace A
- [ ] Switch to workspace B - site not visible
- [ ] Create different site in B
- [ ] Switch back to A - only site A visible
- [ ] No cross-workspace data leakage

#### 12. Status in Overview
- [ ] Go to /overview dashboard
- [ ] New KPI card "Strony" shows count of ACTIVE sites
- [ ] "Miejsca publikacji" section shows up to 3 active sites
- [ ] Only ACTIVE sites counted
- [ ] If no sites, empty state with "Dodaj stronę" CTA
- [ ] Count updates after create/delete

#### 13. Polish Language (All UI in Polish)
- [ ] "Strony", "Nazwa", "Typ", "Adres strony", "Status"
- [ ] "Notatki (opcjonalnie)"
- [ ] "Dodaj stronę", "Zaktualizuj stronę", "Edytuj", "Usuń"
- [ ] "Aktywna", "Nieaktywna"
- [ ] "WordPress", "Shopify", "Inna"

#### 14. Mobile Responsive
- [ ] Table scrollable on small screens
- [ ] Modal usable on mobile
- [ ] Search and buttons accessible

#### 15. Performance
- [ ] Page loads with 10+ sites
- [ ] Search instant (client-side)
- [ ] No console errors

---

## Ustawienia projektu - Test Checklist

- [ ] Nawigacja po /settings/project/* działa, layout jest spójny, brak błędów TS
- [ ] Ogólne pokazuje nazwę i ID workspace oraz działa "Kopiuj ID"
- [ ] Liczniki pokazują członków, strony, domeny i treści (jeśli są)
- [ ] "Stan projektu" reaguje na brak danych i pokazuje właściwe CTA
- [ ] Zespół renderuje listę członków (name/email) i role po polsku
- [ ] Widoczny licznik miejsc X/Y i soft-lock CTA przy limicie
- [ ] Modal usuwania ma potwierdzenie oraz blokady dla self/owner
- [ ] Sekcja Zaproszenia jest widoczna jako "Wkrótce" i wygląda wiarygodnie
- [ ] Role i dostęp pokazują 4 role z opisami i uprawnieniami
- [ ] Brak akcji edycyjnych (tylko informacyjne)
- [ ] Sekcja "Wkrótce" jest wyraźnie oznaczona
- [ ] Plan i limity pokazują plan i rozliczenie (domyślnie roczne)
- [ ] Usage pokazuje X/Y dla users/sites/domains
- [ ] Soft-lock komunikaty są czytelne
- [ ] Sekcja pakietów pokazuje 4 plany + wyróżnia "Popularny"
- [ ] "Rocznie" jest domyślne i promowane
- [ ] Strony pokazują listę, typy, status i stan integracji
- [ ] Licznik X/Y działa i blokuje dodawanie po limicie
- [ ] Sekcja "Stan integracji" pokazuje poprawne liczniki
- [ ] Puste stany i onboarding działają (X==0 i X>0)
- [ ] Link do /sites działa
- [ ] Zakładki AI i Zaawansowane są widoczne i czytelne
- [ ] Wszystkie sekcje są informacyjne (brak mutacji)
- [ ] "Wkrótce" jest jednoznacznie oznaczone
- [ ] Ton i język spójne z całym systemem
- [ ] Overview pokazuje priorytet dnia
- [ ] Action cards reagują na dane
- [ ] Status projektu zmienia się logicznie
- [ ] Health Score liczy się poprawnie
- [ ] Timeline pokazuje publikacje

---

## Treści - Content Workflow Machine

- [ ] /content renderuje się bez błędów i pokazuje header "Treści"
- [ ] Power bar ma: search input, view switch (Kanban/Lista), filtry (Typ, Status), CTA "Dodaj treść", licznik treści
- [ ] View switch przełącza między Kanban i Lista bez przeładowania
- [ ] Filtry działają (Status, Typ) i zmieniają URL z query params
- [ ] Search filtruje po temacie i słowie kluczowym (case-insensitive)
- [ ] Empty state pokazuje 3 kroki i CTA "Dodaj pierwszą treść"

### Kanban View
- [ ] 6 kolumn: Szkice, Do zatwierdzenia, Zatwierdzone, Zaplanowane, Opublikowane, Odrzucone
- [ ] Każda kolumna pokazuje badge z licznikiem
- [ ] Puste kolumny pokazują helpful message, np. "Brak treści do zatwierdzenia — dobry znak."
- [ ] Karty treści pokazują: temat, typ, status badge, słowo kluczowe, autora, (opcjonalnie datę)
- [ ] Na karcie Awaiting_Approval: buttony "Zatwierdź" i "Odrzuć"
- [ ] Na karcie Approved: button "Zaplanuj publikację"
- [ ] Na karcie Rejected: link "Napraw i wyślij"
- [ ] Button "Odrzuć" wymaga komentarza w prompt (walidacja)
- [ ] Button "Zaplanuj" wymaga daty/czasu w prompt (walidacja)
- [ ] Akcje zapisują się w DB i reflektują w UI (optymistycznie)

### List View
- [ ] Tabela z kolumnami: Temat, Typ, Status, Autor, Termin, Ostatnia zmiana
- [ ] Checkboxy na każdym wierszu dla bulk actions
- [ ] "Zaznaczono: X" bar pojawia się u dołu gdy są zaznaczone wiersze
- [ ] Bulk actions: "Zatwierdź zaznaczone", "Przenieś do szkiców"
- [ ] Bulk action buttons są disabled dla EDITOR
- [ ] Zaznaczenie ALL checkbox zaznacza wszystkie wiersze

### /content/[id] - Szczegóły treści
- [ ] Strona ładuje się ze szczegółami treści (meta, wersja, historia)
- [ ] Status badge pokazuje aktualny status
- [ ] Meta section pokazuje: Typ, Słowo kluczowe, Autor, Status, Data planowania
- [ ] Ostatnia wersja pokazuje: title, meta-title, meta-desc, outline, body
- [ ] Historia zmian pokazuje ostatnie 10 wpisów AuditLog
- [ ] Historia pokazuje: kto, co zrobił, kiedy, komentarz (jeśli odrzucenie)
- [ ] Decision Panel (sidebar): Zatwierdź/Odrzuć (dla Awaiting_Approval, APPROVER/OWNER)
- [ ] Odrzucenie wymaga komentarza i zapisuje go w AuditLog.after.comment
- [ ] Decision Panel: Zaplanuj publikację (dla Approved, OWNER/APPROVER)
- [ ] Zaplanowanie zmienia status na SCHEDULED i ustawia scheduledFor

### /content/new - Dodawanie treści
- [ ] Formularz ma pola: Temat, Typ, Główne słowo kluczowe (wszystkie wymagane)
- [ ] Typ ma opcje: "Post WordPress", "Post LinkedIn"
- [ ] Submit button wyłączony dla nie-EDITOR
- [ ] Po utworzeniu: redirect do /content, toast "Treść dodana"
- [ ] Nowa treść pojawia się w kolumnie "Szkice"
- [ ] Autor jest automatycznie ustawiony na currentUserId

### Workflow + Rola
- [ ] EDITOR: może tworzyć, wysyłać do zatwierdzenia, reset rejected do draft
- [ ] EDITOR: NIE może approve/reject/schedule
- [ ] APPROVER: może approve, reject, schedule
- [ ] APPROVER: NIE może create/reset
- [ ] OWNER: może wszystko (super role)
- [ ] Niedozwolone akcje: button disabled + tooltip/alert z powodem

### Blockers Panel
- [ ] Jeśli są treści do zatwierdzenia: "Treści czekające na decyzję: X"
- [ ] Jeśli strony nie skonfigurowane: "Strony wymagające konfiguracji: Y"
- [ ] Każdy blocker ma link do rozwiązania (content filter / settings/sites)

### Server Actions + Audit
- [ ] createContent: tworzy item w DB, loguje do AuditLog (action: "create")
- [ ] updateContentStatus: waliduje workflow transition, loguje (before/after)
- [ ] approveContent: ustawia approvedById, loguje  (action: "approve")
- [ ] rejectContent: wymaga comment, ustawia status REJECTED, loguje z comment w after
- [ ] Jeśli akcja niedozwolona: zwraca {success: false, message: "...po polsku"}
- [ ] Wszystkie akcje workspace-scoped (nie fajują user na innym workspace)

### Edge Cases
- [ ] Brak treści: empty state jest czytelny i ma CTA
- [ ] Jeśli nie ma stron: "Ryzyko publikacji" badge na scheduled treści
- [ ] Draft + GENERATED trafiają do kolumny "Szkice"
- [ ] Workflow maszyna: nie można approve przejść bezpośrednio z Draft (musi być Awaiting_Approval)

---

## Calendar Planning Board - Test Checklist

### Prerequisites (Calendar)
- Workspace active and selected
- At least a few ContentItems in SCHEDULED and APPROVED status
- User role: APPROVER or OWNER for editing permissions
- EDITOR role for read-only verification

### Test Scenarios - Calendar

#### 1. Calendar Page Navigation
- [ ] Click "Kalendarz" in left navigation
- [ ] Verify header shows "Kalendarz publikacji"
- [ ] Verify description: "Planuj publikacje i kontroluj obciążenie tygodnia."
- [ ] Verify view switcher: "Tydzień" | "Miesiąc"
- [ ] Verify date navigator: "←" "Dziś" "→" and current date range
- [ ] Verify stats badge: "📅 Zaplanowane w tym tygodniu: X"

#### 2. Week View Functionality
- [ ] Default view is "Tydzień"
- [ ] Verify 7 columns displayed (Monday to Sunday)
- [ ] Verify today's column highlighted with blue border
- [ ] Each day shows date and day name (e.g., "Pn 10")
- [ ] Scheduled items appear in correct day column
- [ ] Each item shows topic as truncated text with color badge
- [ ] Click "→" to advance one week
- [ ] Click "←" to go back one week
- [ ] Click "Dziś" to return to current week
- [ ] Verify date range label updates correctly

#### 3. Month View Functionality
- [ ] Click "Miesiąc" toggle
- [ ] Verify calendar shows full month grid (6 weeks max)
- [ ] Verify days are numbered correctly
- [ ] Today's date has blue background
- [ ] Each day cell shows up to 2 mini items
- [ ] If more than 2 items in day: "+X więcej" appears
- [ ] Click item in month view opens quick actions modal
- [ ] Navigate to different month with "←" "→"
- [ ] Click "Dziś" returns to current month

#### 4. Backlog Panel (Right Sidebar)
- [ ] Backlog panel shows title "Do zaplanowania"
- [ ] Lists all APPROVED items from current workspace
- [ ] Each backlog item shows: topic, type badge, author name
- [ ] Backlog is scrollable if many items
- [ ] Empty backlog shows: "Nie masz zatwierdzonych treści do zaplanowania."
- [ ] Items stay in backlog until scheduled

#### 5. Drag & Drop Scheduling (APPROVER/OWNER)
- [ ] Drag approved item from backlog onto a day in week view
- [ ] Verify item moves to calendar (changes status from APPROVED → SCHEDULED)
- [ ] Verify scheduledFor is set (default 10:00 AM)
- [ ] Verify item disappears from backlog
- [ ] Drag scheduled item from one day to another
- [ ] Verify scheduledFor updates to new date
- [ ] Verify audit log records action (SCHEDULE_CONTENT / RESCHEDULE_CONTENT)
- [ ] Drag does not work in month view (expected limitation)

#### 6. Drag & Drop - Read-Only Mode (EDITOR)
- [ ] Login as EDITOR role
- [ ] Visit /calendar
- [ ] Verify backlog items are NOT draggable (no cursor-grab)
- [ ] Verify calendar days do not accept drops
- [ ] Verify backlog items appear with reduced opacity
- [ ] Verify no scheduling buttons visible

#### 7. Quick Actions Modal
- [ ] Click on scheduled item in week view
- [ ] Modal opens showing: topic, type, scheduled date/time, author
- [ ] Verify "Otwórz treść" button links to /content/[id]
- [ ] Verify "Usuń z kalendarza" button (only for APPROVER/OWNER)
- [ ] Click "Usuń z kalendarza"
- [ ] Verify item returns to backlog (status → APPROVED, scheduledFor cleared)
- [ ] Verify audit log records UNSCHEDULE_CONTENT
- [ ] Click "Zamknij" to close modal
- [ ] Click outside modal to close

#### 8. Conflict Warnings & Overload Detection
- [ ] Schedule 4+ items on single day
- [ ] Verify badge appears: "⚠️ Dużo publikacji"
- [ ] Schedule 2+ WordPress posts on same day
- [ ] Verify badge appears: "⚠️ Ryzyko kanibalizacji"
- [ ] Schedule 2+ LinkedIn posts on same day
- [ ] Verify badge appears: "⚠️ Ryzyko kanibalizacji"
- [ ] Remove items until conflicts resolve
- [ ] Verify badges disappear

#### 9. Unconfigured Sites Warning
- [ ] If workspace has sites without credentials (wpAppPasswordEnc = null)
- [ ] Verify yellow warning card in header: "⚠️ Niektóre strony nie są skonfigurowane"
- [ ] Click "Skonfiguruj" button
- [ ] Verify redirect to /settings/project/sites
- [ ] Return to calendar after fixing sites
- [ ] Verify warning disappears

#### 10. Empty States
- [ ] In workspace with NO scheduled and NO approved items
- [ ] Verify empty state: "Kalendarz jest pusty."
- [ ] Verify CTA: "Dodaj treść" button links to /content
- [ ] Create and approve some content
- [ ] Verify backlog panel populates
- [ ] Schedule an item
- [ ] Verify it appears in calendar grid

#### 11. Server Actions - Schedule
- [ ] Call setSchedule(contentId, scheduledFor) as APPROVER
- [ ] Verify status changes APPROVED → SCHEDULED
- [ ] Verify scheduledFor and scheduledById are set
- [ ] Verify revalidatePath triggers for /calendar and /content
- [ ] Verify audit log entry created with action: "schedule"

#### 12. Server Actions - Reschedule
- [ ] Call reschedule(contentId, newDate) as APPROVER
- [ ] Verify scheduledFor updates to new date
- [ ] Verify audit log includes before/after dates
- [ ] Verify revalidatePath triggers

#### 13. Server Actions - Unschedule
- [ ] Call unschedule(contentId) as APPROVER
- [ ] Verify status changes SCHEDULED → APPROVED
- [ ] Verify scheduledFor and scheduledById cleared
- [ ] Verify audit log records change
- [ ] Verify revalidatePath triggers

#### 14. Role-Based Access Control
- [ ] EDITOR: Can view calendar and backlog (read-only)
- [ ] EDITOR: Cannot drag items, cannot schedule, cannot unschedule
- [ ] APPROVER: Can schedule, reschedule, unschedule
- [ ] OWNER: Can do all actions
- [ ] Server actions enforce permissions (require APPROVER+)
- [ ] Unauthorized action returns error message

#### 15. Integration with /content Page
- [ ] Schedule item via /calendar
- [ ] Go to /content page
- [ ] Verify item shows status=SCHEDULED, scheduled date visible
- [ ] Unschedule from /calendar
- [ ] Return to /content
- [ ] Verify item back in APPROVED column

#### 16. Header CTAs
- [ ] Verify "Zaplanuj treść" button links to /content/new
- [ ] Verify "Przejdź do Treści" button links to /content
- [ ] Verify warning card only appears when sites unconfigured

#### 17. Visual & UX Polish
- [ ] Week view grid is clean and readable
- [ ] Month view grid adjusts for different month lengths
- [ ] Backlog panel stays fixed while scrolling calendar
- [ ] Drag feedback visible (item opacity changes during drag)
- [ ] Modal centers properly on screen
- [ ] Colors distinguish WP_POST (green) vs LINKEDIN_POST (blue)
- [ ] Today's date clearly highlighted in both views
- [ ] Conflict badges legible and attention-grabbing

#### 18. Multi-Workspace Behavior
- [ ] Schedule items in workspace A
- [ ] Switch to workspace B
- [ ] Verify calendar shows only workspace B items
- [ ] Backlog shows only workspace B approved items
- [ ] Switch back to workspace A
- [ ] Verify workspace A calendar restored correctly

#### 19. Edge Cases
- [ ] Drag item from backlog onto past date (should still work, no date validation)
- [ ] Rapid consecutive drags (should handle without race conditions)
- [ ] Drag onto day that already has 5+ items (should still add, shows overload badge)
- [ ] Month view with 6 weeks displayed (e.g., January 2026) renders correctly
- [ ] Very long topic names truncate properly in calendar cells

#### 20. Performance
- [ ] Loading 50+ scheduled items in month view renders in < 2s
- [ ] Switching views (week ↔ month) is instant
- [ ] Drag operations complete smoothly without lag
- [ ] Backlog with 20+ items scrolls smoothly

#### 21. Accessibility
- [ ] Keyboard navigation: Tab through calendar days
- [ ] Screen reader: Date labels and item topics announced
- [ ] Focus visible on interactive elements
- [ ] Modal can be closed with ESC key (future improvement)

### Known Limitations / Future Improvements
- [ ] Month view drag & drop not implemented (use quick actions instead)
- [ ] No time picker in drag operations (defaults to 10:00 AM)
- [ ] Schedule modal component created but not integrated into backlog panel
- [ ] Could add filters: Type (WordPress/LinkedIn), Author
- [ ] Could add "week view with time slots" for more granular planning
- [ ] Could add bulk scheduling from backlog panel
- [ ] Could show publication status (PUBLISHED vs FAILED) in calendar after attempts

