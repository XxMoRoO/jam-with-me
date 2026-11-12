# Jam With Me 🎸🎹

A touch-first piano rhythm game with a guitar buddy. The app runs from a single static `index.html` file.

## What's new

- **White-key friendly:** Built-in songs stay on C, D, E, F, G, A and B. Five small black keys (C#, D#, F#, G#, A#) are available when the tune needs accidentals.
- **Melody-only MIDI import:** Analyzes tracks and polyphony, isolates the likely lead voice, and *does not put chord notes into the falling-note melody*. Selects a whole-song transposition from -6 to +6 semitones that favours white keys, and applies the same shift to the accompanying chords. Rebuilds the harmony as separate classical-guitar fingerpicking. The separation and chord identification are best-effort, not guaranteed to be an exact transcription.
- **Resizable piano:** Larger and taller touch keys. Use the key-height slider in the song picker or Pause → Settings (110–250 px). The choice is stored in this browser.
- **Compact dropdown:** Choose from the songs menu instead of scrolling a long list.
- **Song manager:** A password-protected UI for adding songs (notes such as `C D E F# G`, or duration syntax `C:2 D#:0.5`), importing MIDI, deleting songs and restoring the built-in defaults.
- **Shape of My Heart:** Listed as a MIDI import option. The actual copyrighted song is *not* bundled; re-import your legally obtained MIDI to use the improved lead/chord separation. Older imports do not contain the original MIDI's octave and track data, so they cannot be repaired automatically.
- **Natural guitar audio:** Real CC0 fingerstyle recordings from Meta Open Sound's nylon-string classical guitar collection, mapped to 18 anchor pitches with small playback-rate shifts. Locally bundled under `assets/nylon/`, with a quieter harmonic fallback if samples cannot load. Individual chord tones play as a gently staggered fingerpicked arpeggio rather than the old buzzing noise loop.
- Touch support for phones and keyboard support on computers (white keys: A S D F J K L; black keys: W E T Y U).

## Nylon guitar audio source and license

18 OGG recordings in `assets/nylon/` are from **Meta Open Sound — Meta Nylon Guitar**, by Meta's Creative Audio team. Licensed **CC0 1.0** (public domain); attribution is optional but provided for transparency. The collection is described at [Meta Open Sound on GitHub](https://github.com/facebookincubator/Meta-open-sound/tree/main/systems/instruments/meta-nylon-guitar), and its license is also available in the source repository. These recorded sounds are not recordings of *Shape of My Heart* or any other copyrighted musical work.

## Important limitations

**The manager is local-only**: Song additions, removals and MIDI imports saved by the owner are stored in the browser's `localStorage`, not shared with other devices or users. The fixed PIN is a client-side UI lock (stored as a hash in the source), **not server-side security**. A technically skilled visitor can bypass it. For a truly private owner-only, site-wide music library, use a backend such as Firebase Authentication + Firestore with security rules. Avoid putting confidential data in the local manager.

For Shape of My Heart, use a licensed arrangement; choosing the placeholder alone doesn't install the melody. Imported songs played without unlocking are session-only. **Re-import MIDI files created by older versions** to get proper lead/harmony extraction; old imports only retain pitch classes and can't be reliably unmixed. Automated melody isolation can confuse complex/polyphonic arrangements—where possible use a MIDI file with a separate lead/melody track.

## Running locally

Open `index.html` in a browser or serve this directory with a simple static file server. For the password verification API (`crypto.subtle`), use HTTPS or `localhost`.

## UI reference

[Jam With Me — Mobile UI Refresh (Figma)](https://www.figma.com/design/BngHF6qnvTPiqbXewETDXH)

## Deployment

Updating this GitHub repository **does not automatically update** the previously shared `chatgpt.site` URL unless that host is explicitly connected to the GitHub repository.
