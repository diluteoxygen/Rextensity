# Rextensity Improvement Roadmap

This document outlines suggested improvements for the Rextensity Chrome extension. All suggestions are designed to enhance functionality, security, performance, and maintainability without breaking existing features.

## 📊 Progress Summary

**Last Updated:** February 14, 2026

### Recently Completed (v0.2.0 - February 2026)
- ✅ **Updated Dependencies**: Knockout.js 3.4.0 → 3.5.1, Underscore.js 1.8.3 → 1.13.6
- ✅ **ES6+ Modernization**: Converted all `var` to `const`/`let`, improved code quality
- ✅ **Code Splitting**: Verified library loading is optimized per page
- ✅ **Developer Experience**: Added source maps for better debugging
- ✅ **Import/Export Profiles**: Full backup/restore capability with JSON format
- ✅ **Keyboard Shortcuts**: Global and in-popup shortcuts for power users
- ✅ **ESLint Configuration**: Code quality linting setup
- ✅ **Centralized Constants**: Single source of truth for magic strings
- ✅ **Profile Validation**: Input validation with clear error messages
- 📝 **Documentation**: Updated README and roadmap with v0.2.0 changes

### Priority Status
- 🔴 **Critical Priority**: 0/3 completed (Manifest V3 migration pending, CSP, Error Handling)
- 🟠 **High Priority**: 3/3 completed (Dependencies ✅, ES6+ ✅, Code Splitting ✅)
- 🟡 **Medium Priority**: 2/3 completed (Import/Export ✅, Keyboard Shortcuts ✅, Favorites)
- 🟢 **Low Priority**: 3/8 completed (Linting ✅, Constants ✅, Validation ✅)

---

## 🔴 Critical Priority (Security & Compatibility)

### 1. Migrate to Manifest V3 
**Impact:** HIGH | **Effort:** HIGH | **Category:** Security & Compatibility ✅ Completed February 2026

**Context:** Chrome is phasing out Manifest V2 (deprecated in 2023, support ending June 2024+). This blocks future Chrome Store updates.

**Changes Required:**
- Update `manifest.json` from `manifest_version: 2` to `manifest_version: 3`
- Replace `browser_action` with `action`
- Convert `background.scripts` to `background.service_worker`
- Update permissions model (host permissions separate from API permissions)
- Replace `chrome.management.setEnabled()` with new V3 APIs (if available)
- Test all functionality with MV3 restrictions

**Benefits:**
- Future-proof the extension
- Improved security model
- Continued Chrome Web Store support

**References:**
- [Chrome Extension Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)

---

### 2. Add Content Security Policy (CSP)
**Impact:** MEDIUM | **Effort:** LOW | **Category:** Security ✅ Completed February 2026

**Context:** No CSP headers defined in manifest.json, leaving potential XSS vulnerabilities.

**Changes Required:**
- Add CSP to manifest.json:
  ```json
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
  ```
- Ensure all inline scripts are moved to external files
- Verify Knockout secure bindings work with strict CSP

**Benefits:**
- Prevents injection attacks
- Blocks unauthorized external resource loading
- Industry best practice compliance

---

### 3. Fix Silent Error Handling
**Impact:** MEDIUM | **Effort:** LOW | **Category:** Code Quality ✅ Completed February 2026

**Context:** Multiple instances of empty catch blocks hide errors:
- `profiles.js:78-82` - Silent catch ignoring all errors
- `index.js:39` - Empty catch when enabling extensions

**Changes Required:**
- Add proper error logging:
  ```javascript
  try {
    self.exts.find(id).enable();
  } catch(e) {
    console.error('Failed to enable extension:', id, e);
  }
  ```
- Replace `catch(e) { /*No profiles*/ }` with explicit empty array check
- Consider adding user-facing error messages for critical failures

**Benefits:**
- Easier debugging
- Better user experience with error messages
- Prevent silent failures

---

## 🟠 High Priority (Performance & Modernization)

### 4. Update Outdated Dependencies ✅ COMPLETED
**Impact:** MEDIUM | **Effort:** MEDIUM | **Category:** Performance & Security
**Status:** ✅ Completed February 2026

**Context:** Using ancient versions of core libraries:
- Knockout.js 3.4.0 (2015) → Updated to 3.5.1
- Underscore.js 1.8.3 (2015) → Updated to 1.13.6

**Changes Completed:**
- ✅ Updated Knockout.js to 3.5.1
- ✅ Updated Underscore.js to 1.13.6
- ✅ Added source maps for Underscore.js for better debugging
- ✅ Updated all HTML files to reference new library versions
- ✅ Verified all view bindings and computeds work correctly

**Benefits:**
- Bug fixes and performance improvements from newer library versions
- Security patches included in updated versions
- Better browser compatibility with modern Chrome versions
- Source maps for easier debugging

---

### 5. Adopt Modern JavaScript (ES6+) ✅ COMPLETED
**Impact:** MEDIUM | **Effort:** HIGH | **Category:** Code Quality
**Status:** ✅ Completed February 2026

**Context:** Code uses ES5 syntax (var, function, callbacks). Modern JS offers cleaner patterns.

**Changes Completed:**
- ✅ Replaced all `var` with `const`/`let` throughout codebase
- ✅ Modernized variable declarations in engine.js
- ✅ Modernized variable declarations in index.js
- ✅ Modernized variable declarations in options.js
- ✅ Modernized variable declarations in profiles.js
- ✅ Modernized variable declarations in migration.js
- ✅ Improved code readability with block-scoped variables

**Benefits:**
- More readable and maintainable code
- Block-scoped variables prevent accidental reassignment
- Better alignment with modern JavaScript standards
- Improved code quality and consistency
- Smaller potential for scope-related bugs

---

### 6. Implement Code Splitting ✅ VERIFIED
**Impact:** LOW | **Effort:** MEDIUM | **Category:** Performance
**Status:** ✅ Already Optimized

**Context:** Library loading is already optimized per page.

**Current Implementation:**
- ✅ index.html: Uses all libraries (needs Knockout, Underscore, and Underscore.string)
- ✅ options.html: Only loads essential libraries (no Underscore.string needed)
- ✅ profiles.html: Uses all libraries (needs Knockout, Underscore, and Underscore.string)
- ✅ Knockout Secure Binding loaded only where needed

**Benefits:**
- Already optimized page load times
- Minimal memory footprint per page
- No unnecessary library loading

---

## 🟡 Medium Priority (Features & UX)

### 7. Add Import/Export for Profiles ✅ COMPLETED
**Impact:** HIGH | **Effort:** MEDIUM | **Category:** Feature
**Status:** ✅ Completed February 2026

**Context:** Users mentioned in TODO.md - no backup/share capability for profiles.

**Changes Completed:**
- ✅ Added "Export Profiles" button in profiles.html
  - Generates JSON file with all profiles
  - Downloads to user's computer with timestamp in filename
  - Format: `{"version": "1.0", "timestamp": "...", "profiles": {...}}`
- ✅ Added "Import Profiles" button
  - File picker for JSON upload
  - Validates file structure and version
  - Merges with existing profiles (skips duplicates)
  - Handles errors gracefully with user feedback
  - Auto-saves after successful import
- ✅ Added visual feedback for import success/error states
- ✅ Styled buttons and feedback messages

**Benefits:**
- ✅ Backup/restore capability for profiles
- ✅ Share profiles between devices/users
- ✅ Disaster recovery protection
- ✅ Easy profile migration

---

### 8. Add Keyboard Shortcuts ✅ COMPLETED
**Impact:** MEDIUM | **Effort:** MEDIUM | **Category:** Feature
**Status:** ✅ Completed February 2026

**Context:** All features are click-only. Keyboard shortcuts improve accessibility and power user experience.

**Changes Completed:**
- ✅ Added manifest commands for global shortcuts:
  - `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`) - Open/close Rextensity popup
  - `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) - Toggle all extensions globally
- ✅ Implemented in-popup keyboard shortcuts:
  - `/` - Focus search box
  - `Esc` - Clear search and unfocus input
  - `↑/↓` - Navigate extension list (native browser behavior)
  - `Ctrl+A` - Toggle all extensions
- ✅ Added visual keyboard shortcuts indicator
  - Keyboard icon in header opens help panel
  - Styled kbd elements show all available shortcuts
  - Toggle panel on/off with click
- ✅ Background service worker handles global commands
  - Respects "Always On" profile settings
  - Saves/restores toggle state between sessions

**Benefits:**
- ✅ Improved accessibility for keyboard-only users
- ✅ Faster workflows for power users
- ✅ Industry standard feature implementation
- ✅ Global shortcuts work even when popup is closed

---

### 9. Add Favorites Feature
**Impact:** LOW | **Effort:** MEDIUM | **Category:** Feature

**Context:** Mentioned in TODO.md - "Add list of favorite extensions"

**Changes Required:**
- Add "favorite" flag to ExtensionModel
- Add star icon next to each extension
- Add "Favorites" profile (reserved like "Always On")
- Persist favorites in chrome.storage.sync
- Option to show favorites at top of list

**Benefits:**
- Quick access to frequently used extensions
- Better organization for large collections
- User-requested feature

---

## 🟢 Low Priority (Code Quality & Developer Experience)

### 10. Add Linting and Code Formatting ✅ COMPLETED
**Impact:** LOW | **Effort:** LOW | **Category:** Developer Experience
**Status:** ✅ Completed February 2026

**Context:** No linting configuration. Inconsistent code style across files.

**Changes Completed:**
- ✅ Added `.eslintrc.json` with eslint:recommended configuration
- ✅ Created `package.json` with lint scripts (npm run lint, npm run lint:fix)
- ✅ Configured ES6 environment with browser/webextensions support
- ✅ Set up per-file overrides for proper global scope handling
- ✅ Updated BUILD.md with linting documentation
- ✅ Fixed linting issues found (1 extra semicolon)

**Benefits:**
- ✅ Catches bugs early (undefined variables, typos)
- ✅ Baseline for consistent code style
- ✅ Foundation for future improvements
- ✅ Zero errors, zero warnings on current codebase

---

### 11. Add Source Maps for Libraries
**Impact:** LOW | **Effort:** LOW | **Category:** Developer Experience

**Context:** Minified libraries lack source maps, making debugging difficult.

**Changes Required:**
- Include source maps for:
  - knockout-3.4.0.js
  - underscore-min.js
  - knockout-secure-binding.min.js
- Update Makefile to preserve source maps in dist
- Document how to enable source maps in Chrome DevTools

**Benefits:**
- Easier debugging
- Better developer experience
- Faster issue resolution

---

### 12. Separate Storage Logic from Models
**Impact:** LOW | **Effort:** MEDIUM | **Category:** Code Quality

**Context:** `engine.js` mixes data models, storage logic, and Knockout extenders. Violates Single Responsibility Principle.

**Changes Required:**
- Create separate modules:
  - `models.js` - ExtensionModel, ProfileModel
  - `storage.js` - Chrome storage wrappers
  - `extenders.js` - Knockout custom extenders
- Use dependency injection for storage in models
- Update imports in index.js, options.js, profiles.js

**Benefits:**
- Better testability
- Clearer separation of concerns
- Easier to maintain

---

### 13. Centralize Magic Strings ✅ COMPLETED
**Impact:** LOW | **Effort:** LOW | **Category:** Code Quality
**Status:** ✅ Completed February 2026

**Context:** Hardcoded strings like `"__always_on"`, `"__reserved"` scattered across files.

**Changes Completed:**
- ✅ Created `js/constants.js` with RESERVED_PROFILES object:
  ```javascript
  const RESERVED_PROFILES = {
    ALWAYS_ON: '__always_on',
    DISPLAY_NAMES: {
      '__always_on': 'Always On'
    }
  };
  ```
- ✅ Replaced all hardcoded `"__always_on"` strings with constant (4 replacements)
- ✅ Added constants.js import to all HTML files and service worker
- ✅ Single source of truth for reserved profile names

**Benefits:**
- ✅ Prevents typos in reserved profile names
- ✅ Easier to add new reserved profiles
- ✅ More maintainable codebase

---

### 14. Add Development Mode with Watch
**Impact:** LOW | **Effort:** LOW | **Category:** Developer Experience

**Context:** Makefile only supports production builds. No watch mode for development.

**Changes Required:**
- Add `make dev` target:
  ```makefile
  dev:
    @echo "### Running in development mode"
    nodemon --watch js --watch styles --exec "make copy"
  ```
- Skip minification in dev mode
- Add browser-sync for live reload (optional)
- Document development workflow in BUILD.md

**Benefits:**
- Faster development iteration
- No need to run `make` manually
- Better developer experience

---

### 15. Add Unit Tests
**Impact:** LOW | **Effort:** HIGH | **Category:** Code Quality

**Context:** No test suite exists. Difficult to verify changes don't break functionality.

**Changes Required:**
- Add Jest or Mocha test framework
- Write tests for:
  - ExtensionModel toggle/enable/disable
  - ProfileModel reserved name handling
  - Search filtering logic
  - Storage persistence
- Add test coverage reporting
- Add `make test` target

**Benefits:**
- Catch regressions early
- Confidence in refactoring
- Documentation through tests

---

### 16. Improve Error Messages for Users
**Impact:** LOW | **Effort:** LOW | **Category:** UX

**Context:** Most errors are silent or console-only. Users don't know when things fail.

**Changes Required:**
- Add toast notification system for errors:
  - "Failed to enable extension X"
  - "Profile save failed (quota exceeded)"
  - "Extension removed by user"
- Use consistent error UI (similar to save-result message)
- Add retry buttons for transient failures

**Benefits:**
- Better user experience
- Users understand what went wrong
- Reduces support burden

---

### 17. Add Profile Name Validation ✅ COMPLETED
**Impact:** LOW | **Effort:** LOW | **Category:** Code Quality
**Status:** ✅ Completed February 2026

**Context:** Profile names limited to 30 chars by string pruning. No validation on input.

**Changes Completed:**
- ✅ Added validation in profiles.js add() function with clear error messages:
  - Empty name check: "Profile name is required."
  - Length check (>30): "Profile name is too long (maximum 30 characters)."
  - Reserved prefix check: "Profile names cannot start with '__' (reserved prefix)."
- ✅ Added `.trim()` to handle whitespace-only names
- ✅ Uses native alert() - no new dependencies

**Benefits:**
- ✅ Better UX with clear validation feedback
- ✅ Prevents reserved name conflicts before creation
- ✅ Prevents overly long names (previously silently truncated)
- ✅ Consistent naming standards

---

## 📊 Technical Debt Summary

### Lines of Code
- **Total:** ~1,882 lines (JS + CSS + HTML)
- **JavaScript:** ~650 lines (excluding libraries)
- **HTML:** ~300 lines
- **CSS:** ~932 lines

### Dependency Versions
| Library | Current | Latest | Age |
|---------|---------|--------|-----|
| Knockout.js | 3.4.0 | 3.5.1 | 8+ years |
| Underscore.js | 1.8.3 | 1.13.6 | 8+ years |
| Font Awesome | Unknown (minified) | 6.5.1 | Unknown |

### Browser Compatibility
- **Chrome:** Yes (but Manifest V2 deprecated)
- **Edge:** Yes (Chromium-based)
- **Firefox:** No (requires WebExtensions API adjustments)
- **Safari:** No (requires significant changes)

---

## 🎯 Recommended Implementation Order

### Phase 1: Critical (Q1 2026)
1. Manifest V3 Migration (#1)
2. Add CSP (#2)
3. Fix Error Handling (#3)

### Phase 2: Modernization (Q2 2026)
4. Update Dependencies (#4)
5. ES6+ Adoption (#5)
6. Import/Export Profiles (#7)

### Phase 3: Polish (Q3 2026)
7. Advanced Search (#8)
8. Keyboard Shortcuts (#9)
9. Code Splitting (#6)

### Phase 4: Maintenance (Q4 2026)
10. Linting & Formatting (#11)
11. Unit Tests (#16)
12. Refactoring (#13, #14)

---

## 🔗 Additional Resources

- [Chrome Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Knockout.js Documentation](https://knockoutjs.com/documentation/introduction.html)
- [Chrome Management API](https://developer.chrome.com/docs/extensions/reference/management/)
- [Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

---

## 📝 Notes

- All improvements preserve existing functionality
- Changes are backward compatible where possible
- User data (profiles, options) is never lost
- Security improvements take highest priority
- Community contributions welcome via CONTRIBUTING.md

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Maintainer:** Rextensity Team
