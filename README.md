# Jam With Me 🎸🎹

A touch-first piano rhythm game with a guitar buddy. The app runs from a single static `index.html` file.

## What's new

- **White-key friendly:** Built-in songs stay on C, D, E, F, G, A and B. Five small black keys (C#, D#, F#, G#, A#) are available when the tune needs accidentals.
- **Smarter MIDI import:** Tries transpositions from -6 to +6 semitones to maximize white-key notes without dropping notes or changing the melody's relative intervals. All twelve pitch classes remain playable. The guitar accompaniment for imports is approximate.
- **Resizable piano:** Larger and taller touch keys. Use the key-height slider in the song picker or Pause → Settings (110–250 px). The choice is stored in this browser.
- **Compact dropdown:** Choose from the songs menu instead of scrolling a long list.
- **Song manager:** A password-protected UI for adding songs (notes such as `C D E F# G`, or duration syntax `C:2 D#:0.5`), importing MIDI, deleting songs and restoring the built-in defaults.
- **Shape of My Heart:** Listed as a MIDI import option. The actual copyrighted song is *not* bundled; supply a MIDI arrangement you are permitted to use.
- Touch support for phones and keyboard support on computers (white keys: A S D F J K L; black keys: W E T Y U).

## Important limitations

**The manager is local-only**: Song additions, removals and MIDI imports saved by the owner are stored in the browser's `localStorage`, not shared with other devices or users. The fixed PIN is a client-side UI lock (stored as a hash in the source), **not server-side security**. A technically skilled visitor can bypass it. For a truly private owner-only, site-wide music library, use a backend such as Firebase Authentication + Firestore with security rules. Avoid putting confidential data in the local manager.

For the imported Shape of My Heart MIDI, use a licensed arrangement; selecting the placeholder alone doesn't install the melody. Imported songs played without unlocking are session-only.

## Running locally

Open `index.html` in a browser or serve this directory with a simple static file server. For the password verification API (`crypto.subtle`), use HTTPS or `localhost`.

## UI reference

[Jam With Me — Mobile UI Refresh (Figma)](https://www.figma.com/design/BngHF6qnvTPiqbXewETDXH)

## Deployment

Updating this GitHub repository **does not automatically update** the previously shared `chatgpt.site` URL unless that host is explicitly connected to the GitHub repository.
