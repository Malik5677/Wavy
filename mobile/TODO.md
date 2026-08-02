# WhatsApp iOS Dark Theme — Mobile UI Redesign TODO

## Goal
Redesign only the mobile UI to match WhatsApp iOS Dark Theme. No backend/API/logic changes.

## Steps
- [x] 1. Create TODO.md tracking checklist
- [x] 2. Install `expo-blur` (Expo Go compatible) for glass tab bar
- [x] 3. Update `constants/theme.ts` — add tab bar / FAB color tokens
- [x] 4. Create `app/(tabs)/communities.tsx` — UI-only Communities placeholder screen
- [x] 5. Redesign `app/(tabs)/_layout.tsx` — floating glass tab bar:
  - [x] 5 tabs: Updates, Calls, Communities, Chats, Settings (Chats initial)
  - [x] Rounded floating BlurView container, translucent dark bg
  - [x] Selected tab (#2C2C2E) rounded gray pill, white icon/label
  - [x] Safe area respected
- [x] 6. Redesign `app/(tabs)/chats.tsx`:
  - [x] iOS header: circular More button (left), centered large "Chats" title
  - [x] Remove Android-style message-plus header icon
  - [x] Archived row: full-width, archive icon + gray text, inset divider
  - [x] Chat rows: 56px avatar, name/time top row, preview/badge bottom row
  - [x] Inset hairlines between rows (marginLeft aligned to avatar)
  - [x] Pin icon far-right, muted icon, green unread badge, typing indicator
  - [x] 3 FABs (Payments, Camera small circles; green New Chat +):
    - [x] Spring/fade mount animation, soft shadows, press feedback
    - [x] New Chat preserves existing routing
    - [x] Payments/Camera show non-breaking toast (no backend)
  - [x] Extra bottom padding so list clears floating tab bar + FABs
- [x] 7. Polish headers (remove hairline bottom borders) in:
  - [x] `status.tsx`
  - [x] `calls.tsx`
  - [x] `settings.tsx`
- [x] 8. Typecheck: `npx tsc --noEmit` (passed — 0 errors)
- [x] 9. Ready for Expo Go verification: `npx expo start` → scan QR in Expo Go

## Scope Guards (do NOT touch)
- Backend/, APIs, sockets, Redux, routing logic, chat open/load functions
- Web/frontend files, database, deployment configs
