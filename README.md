# Flashcard Flipper — installable phone app (PWA) for iPhone & Android

A self-contained flashcards app you install onto your iPhone, iPad, or Android
**home screen** — no Mac, no Xcode, no signing, no expiring certificates, no Play
Store. It works **fully offline** once installed and stores your cards on the device.
Its mascot is **Flipper**, a friendly sea turtle whose flippers are flashcards.

**Live app:** https://luriejoe.github.io/flashcards-app/

## What it does

Three tabs — **Home**, **Study**, and **Import**:

- **Home:** a short welcome and quick links to get started. Appearance settings
  (theme, accent, font size, sound) live in **Settings** — the gear icon in the
  top-left corner (see Themes below).
- **Multiple decks:** create, rename, delete, and switch decks. Each imported file
  becomes its own deck. Cards are saved per-deck.
- **Auto-create a deck (Import tab):** choose a built-in deck (e.g. *Animals*,
  *World Flags*, or *Spanish Vocabulary*) and pick a card count (10/25/50/All) to
  instantly build a deck from a bundled knowledge base — generated **on-device**,
  nothing leaves your phone. Built-in packs: Animals, World Capitals, World Flags,
  US State Capitals, US Presidents, Multiplication Tables, Chemical Elements,
  Spanish Vocabulary, French Vocabulary, Portuguese Vocabulary, Planets & Space,
  US Civics Basics, Colors, and Shapes.
- **Streamlined Import tab:** choose built-in decks from a dropdown, import a supported
  file, or expand **Create a deck** only when you need the manual card editor and its
  formatting instructions.
- **World Flags:** creates up to 195 visual-recognition cards with a flag emoji on the
  question side and the country name on the answer side. Platforms without native flag
  emoji support use bundled SVG fallbacks, so the deck remains consistent and fully
  offline. The flag visual is hidden from assistive technology until the answer is
  revealed so its encoded country does not spoil the question.
- **Rich card formatting (optional):** card text supports a small, safe syntax —
  `**bold**`, `*italic*`, line breaks, colored text `{{c:red|text}}` (name or `#hex`),
  and filled shapes `{{shape:circle|#4f46e5|120}}` (circle, square, rectangle, oval,
  triangle, diamond, pentagon, hexagon, star, heart). Rendered with HTML-escaping and a
  strict whitelist, so shared decks can't inject anything. The **Colors** and **Shapes**
  auto-create packs are built with this syntax.
- **Bulleted lists (optional):** separate answers with a **semicolon** to turn a
  one-liner into a bulleted list — e.g. `Name a primary color | Red; Blue; Yellow`
  renders three bullet points. Works on either side of the card and still supports the
  rich syntax above per item. Need a literal semicolon (grammar/punctuation cards)?
  Escape it as `\;`.
- **Profiles (local, no login):** tap the round **avatar in the top-right** to switch
  between profiles or add a new one. Each profile keeps its **own decks, appearance,
  font size, and color theme** — perfect for a shared iPad where each kid gets their
  own space. Profiles are **stored on-device only**: no accounts, no passwords, no sync.
  Your existing cards automatically become the first profile ("Me").
- **Tips (💡):** tap the **lightbulb** next to the ⚙ gear for a quick set of tips —
  how to switch profiles, import a deck, flag and drill cards, tap to flip, and swipe
  between cards. Toggle **Show tips at startup** (on the Home screen or in Settings)
  to see a different quick tip each time you open the app, and **Show tips as you
  navigate** for short, in-context reminders as you move around.
- **Import / create (Import tab):** tap **Import file** to load cards from:
  - **`.docx`** (Word) — auto-detects 2-column tables, `question | answer` lines,
    `Q:`/`A:` labels, or alternating lines. Parsed fully offline on-device.
  - **`.csv`** / **`.txt`** — `question,answer` or any of the separators below.
  - **`.json`** — a deck exported from this app (round-trips name + cards).

  Or expand **Create a deck** and type/paste a list, one card per line. Separators
  accepted: `question | answer`, `question - answer`, a tab, or a comma (CSV).
  A header row like `Question,Answer` or `Word,Definition` is skipped automatically.
- **Export deck:** save the current deck to a `.json` file (backup or share).
- **Study (Study tab):**
  - Choose **Flashcards**, **Matching Pairs**, or **Multiple Choice**, then use one
    Start button. Mode-specific controls appear only when relevant.
  - **Flashcards:** pick **one or more decks** from a checklist — **multi-select**
    studies the selected decks together. Empty decks are disabled; "Select all" is
    available. **Reverse** applies only to Flashcards; it is hidden in the game modes.
  - Tap a card to flip; swipe or use Prev/Next; **Shuffle** to randomize.
  - **Matching Pairs:** select one deck and play with five applicable cards at a
    time. The app measures both sides against the phone-sized tiles and enables
    the game only when at least five cards are applicable. Questions stay in the
    left column and answers stay in the right, with each column shuffled
    independently. Repeated questions or answers are kept out of the same round;
    matched pairs remain visible in a dimmed green state, and correct and incorrect
    choices use different sounds when sound effects are enabled. Every round
    contains exactly five pairs; extra cards are reshuffled into a later play.
  - **Multiple Choice:** select one deck and answer applicable questions using
    choices generated locally from other answers in that deck. Questions and choices
    are measured at the current screen and font size. Single-answer cards receive
    three unique distractors. Answers containing two to four semicolon-separated items
    become "Choose every correct answer" questions with multiple correct choices and two
    additional distractors. Questions, distractors, and answer order are randomized for
    each play. Correct and incorrect answers have distinct feedback and sounds, and the
    results screen supports replay or reviewing missed questions.
  - **Flag for review:** each card has a **⚑ Flag this card for review** checkbox.
    Flags are saved per card. The deck picker shows a **⚑ count** per deck, and an
    **"Only study flagged cards"** toggle lets you drill just the flagged ones across
    the selected deck(s).
  - **Share or hide a deck:** swipe a deck row left (or hover on desktop) to reveal
    **Share** and **Hide**.
    - **Share** sends the deck as a `.json` file via the native share sheet on
      iPhone/Android (AirDrop, Messages, Mail, etc.); on desktop it downloads the
      `.json` to attach and send. The recipient imports it on the Import tab.
    - **Hide** removes a deck from the Study list without deleting it. Hidden decks
      collect under a **"Hidden decks (N)"** section with an **Unhide** button, and
      still appear (marked "— hidden") in the Import deck menu.
- **Themes:** in **⚙ Settings** choose a **mode** (System / Light / Dark) and an
  **accent color** (Indigo, Blue, Teal, Green, Purple, Rose, Orange, Cranberry). Mode and
  accent are independent and combine; **System** follows your phone's setting live. Your
  choice is saved and applied before first paint (no flash).
- **Settings (⚙ top-left):** Appearance (theme + accent), Preferences
  (**sound effects** ding on flip, **study timer** with tap-to-pause, **font size**
  Small/Default/Large/XL), a **Help Center** FAQ, **Feedback** (opens a prefilled GitHub
  issue), and a **Privacy Policy**.
- Everything is saved locally (browser `localStorage`) and survives app restarts.

Example paste input:
```
What is the capital of France? | Paris
2 + 2 | 4
Largest planet | Jupiter
```

## Sample decks

Two small starter decks are **built in and seeded automatically the first time you
launch** (they also appear once for existing users on update; deleting them won't make
them return, and they never duplicate):

- **SAMPLE-Capitals** — 5 world-capital cards.
- **SAMPLE-Math** — 5 arithmetic cards.

They're also included as importable files: `decks/SAMPLE-Capitals.json` and
`decks/SAMPLE-Math.json`.

## Files
```
index.html            App shell + markup (Home / Study / Import / Settings)
styles.css            Styling: themes (light/dark/system + accents), card flip animation
generators.js         Built-in offline topic packs for "Auto-create a deck"
app.js                All logic (decks, parsing, .docx/.csv/.json import, study,
                      flagging, generation, sample seeding, theme/preferences)
manifest.webmanifest  PWA metadata (name, icons, standalone display)
service-worker.js     Offline caching
icons/                App icons (generated by make_icons.py)
flags/                Optimized offline flag fallbacks from flag-icons (MIT license)
make_icons.py         Regenerate icons with Pillow (optional)
decks/                Ready-made sample decks you can import
```

World Flags fallback artwork is from
[flag-icons 7.5.0](https://github.com/lipis/flag-icons) and is included under its MIT
license in `flags/LICENSE.flag-icons.txt`.

## About PDFs
There is **no reliable, offline way to import an arbitrary PDF** in-browser: many
study PDFs store their text as vector outlines with no real text layer, so only OCR can
read them. If you have such a PDF, OCR/convert it to a **text-based** `.docx` (open it in
Word) and import that. Text-based PDFs can be opened, copied, and pasted into the Import
tab. Scanned or image-only files (including image-only `.docx`) can't be imported without
OCR first.

## Get it onto your phone (iPhone, iPad, or Android)

A PWA installs right from the browser over **HTTPS** (or `localhost`). The app is already
hosted at **https://luriejoe.github.io/flashcards-app/** — open that link on your device
and add it to your home screen:

- **iPhone / iPad (Safari):** tap **Share → Add to Home Screen → Add**.
- **Android (Chrome):** tap the **⋮** menu → **Install app** (or **Add to Home screen**) → **Install**.

Launch it from the new icon; it runs full-screen and offline.

If you want to host your own copy, pick one option:

### Option A — GitHub Pages (free, permanent HTTPS URL)
1. Push this repo's files (the app lives at the repo **root**) to a GitHub repo.
2. In the repo: **Settings → Pages → Build from a branch**, select your branch and the
   `/ (root)` folder, then Save.
3. Wait ~1 minute; GitHub gives you an `https://<user>.github.io/<repo>/` URL.
4. On your phone, open that URL — **Safari** on iOS, **Chrome** on Android.
5. Add it to your home screen: iOS **Share → Add to Home Screen → Add**; Android
   **⋮ → Install app / Add to Home screen → Install**.
6. Launch it from the new home-screen icon. It now runs full-screen and offline.

### Option B — Free static host (Netlify / Vercel / Cloudflare Pages)
Drag-and-drop this app folder onto Netlify Drop (https://app.netlify.com/drop) to get an
instant HTTPS URL, then follow steps 4–6 above.

### Option C — Quick test on your local network (same Wi-Fi)
Run from this folder on your PC:
```powershell
python -m http.server 8000
```
Find your PC's IP (`ipconfig`), then on the phone open `http://<PC-IP>:8000/` (Safari on
iOS, Chrome on Android) and add it to your home screen.
Note: over plain `http://` on a LAN, the offline service worker won't register (iOS and
Android both require HTTPS off-localhost), but the app still works while the server is
running. Use Option A or B for true offline use.

## Updating
The app is served with a versioned service worker cache. After you deploy changes, fully
close the home-screen app and reopen it (once or twice) to pick up the new version. Your
decks, flags, and theme choice are preserved across updates.

The current and immediately preceding HTML/JavaScript shells remain compatible during
rollout. This prevents a temporary mixed-cache state from stopping startup while GitHub
Pages and the service worker replace files at slightly different times. Compatibility
controls may remain hidden in the HTML for this purpose; they do not appear in the
current interface or modify locally stored decks.

## Why a PWA instead of a native `.ipa`?
Native sideloading (AltStore/Sideloadly) needs an Xcode-built, signed `.ipa`. With a
free Apple ID the signature **expires every 7 days** and building requires a Mac. A PWA
avoids all of that and is the most practical route on Windows — while still giving you a
real home-screen icon, full-screen launch, and offline use.

## Regenerating icons (optional)
```powershell
python make_icons.py   # requires: pip install pillow
```
