# MOSCATELLI ATLAS — ACCESSIBILITY

Target: WCAG 2.2 AA.

## Implemented through Patch 02
- Semantic header/main/navigation landmarks.
- Skip-navigation link.
- Visible keyboard focus.
- Fluid/responsive text.
- Reduced-motion handling.
- Forced-colours baseline.
- Native `<dialog>` modal for Browse, providing browser-level modal focus containment.
- Explicit focus movement to the close control when Browse opens.
- Explicit focus restoration to the Browse trigger when it closes.
- `aria-current="page"` for active navigation.
- Search form has a programmatic label.
- Blank search submission provides a live textual instruction and returns focus to the input.
- Minimum control sizing is designed around approximately 44px touch targets.

## Deferred tests/features
- Complete keyboard traversal inside large content views.
- Search-result list keyboard navigation and announcements.
- Article table-of-contents accessibility.
- Reading-progress semantics.
- 200% browser-zoom hardening.
- Physical-device and assistive-technology testing.
- Authentication accessibility was completed in Patch 16; physical password-manager/mobile-keyboard/AT validation remains a deployment test.

## Patch 03 additions
- Home search uses a combobox/listbox relationship with `aria-expanded`, `aria-controls`, `aria-activedescendant` and option selection state.
- Arrow Up/Down moves the active suggestion while focus remains in the input; Enter activates; Escape collapses.
- Suggestion rows remain at least 44px tall and retain visible focus treatment.
- Empty submission is announced through the Home live region and returns focus to the search field.

## Patch 06 Search accessibility
- The Search result page uses a labelled native search form and a labelled native subject `<select>`.
- Search result collections expose list/listitem semantics while each result remains a normal deep-link anchor.
- Arrow Down from the result-page input enters the result list; Up/Down traverse links; Escape returns focus to the input.
- The command Search uses native `<dialog>` semantics for focus containment and modality.
- Command Search explicitly closes on Escape even when focus is inside an `<input type="search">`, avoiding browser-specific first-Escape clearing behaviour.
- Browse → Search restores focus to the Browse trigger when the command surface closes without navigation.
- `/` is context-aware and never fires while the user is already typing in an input, textarea, select or editable element.
- Search result changes and command results live inside polite live regions; screen-reader-specific announcement quality remains a later physical/AT test.
- Match highlighting uses semantic `<mark>` while preserving the original surrounding text.


## Patch 11 hardening
- Removed the forced 320px document minimum width, allowing WCAG-style reflow at narrow effective viewports.
- Added concise route-title announcements through a dedicated `role="status"` live region rather than announcing the entire changed route subtree.
- Added explicit Tab/Shift+Tab boundary trapping to Browse and command Search, while retaining native `<dialog>` modality and focus restoration.
- Added `aria-busy` while asynchronous route content resolves.
- Safe-area insets participate in the core horizontal gutter and modal padding.
- Primary controls and high-use interactive surfaces are normalised around an approximately 44px target size.
- Long labels/titles can wrap without forcing horizontal scrolling.
- Dense article, Playbook and Academia layouts collapse using relative-width (`em`) thresholds, improving text-only scaling resilience.
- 200% text-size simulation and zoom-equivalent viewport tests are now part of QA.
- Forced-colours coverage includes bookmarks, update actions and Academia completion controls.
- A print fallback removes interactive furniture and preserves readable long-form content.

### Still requiring physical validation
- VoiceOver on Safari/iOS.
- TalkBack on Android/Chrome.
- NVDA/JAWS on Windows.
- Firefox-specific forced-colours/high-contrast behavior.
- Safari-specific dynamic viewport/keyboard behavior.

## Patch 16 authentication accessibility
- Authentication threshold is a dedicated labelled region and the locked application surface is inert/hidden from interaction.
- Email/password/OTP/reset fields have explicit labels and appropriate autocomplete/input-mode attributes.
- Mobile authentication inputs retain a 16px font size to avoid common automatic focus zoom.
- Loading/error/success messages use a polite live status region.
- Tab focus is contained within the authentication panel while the application is locked.
- Demo mode remains visibly labelled in text, not colour alone.
- Sign-out is keyboard-accessible from Browse and Profile.
- Authentication success motion is bypassed under `prefers-reduced-motion`.
- Forced-colours rules preserve visible borders and status cues.

### Final physical validation still required
Password-manager/autofill behaviour, mobile software keyboards, VoiceOver/TalkBack/NVDA/JAWS and non-Chromium engines require real-device/browser testing before production deployment.
