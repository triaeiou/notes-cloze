# Notes Cloze

Single field version and streamlining of Flexible Cloze, removing a lot of features for easier maintenance and reducing the template to a single field (i.e. no `Back extra`) as the template is intended for long, multi-item notes. Adds note type NotesCloze which is useful when you keep your notes in Anki in longer notes with clozes on rather than many separate small notes.

## iOS

Please note, I have no iOS device to test on, it *should* work as it is generic javascript. If you find something broken and want to let me know, please include debug info (see below).

## Use case

One note generation strategy is keeping one cloze note per "subject", rather than lots of small notes. This allows using Anki as the primary "note keeping location" rather than having the actual notes somewhere else (in OneNote, markdown files etc.) and have to create Anki notes for quizzing as a separate step. It also greatly improves maintainability (at lecture: "hmm, I seem to remember it was X, not Y, now where is that Anki note so I can amend it?"). During reviewing it adds the posibility to easily look up related info ("so if it wasn't ABX X for Y, for what was ABX X used?"). This while following the general **card** principles of making individual cards "atomic" and brief.

```markdown
# ACLS

## Terminology

Bla: {{c1::bla}}
Bla: {{c2::bla}}

## Drugs

Epi: {{c3::bla}}
Amiodarone: {{c4::bla}}

## Process

Unwitnessed arrest: {{c5::

1. Bla
2. Bla

}}
```

You can of course also use NC if you just want some more configurability/functionality for "regular clozes".

## Use

- Clicking an active cloze on the front side will cycle it between hint (if there is one) and show.
- Clicking an inactive cloze on the front side will cycle it between hide and show (no hint).
- Toggle all/cycle between active and/or inactive clozes (configurable) by tapping left/right/top of screen or keyboard shortcuts.
- Search in card from the reviewer (`Ctrl+F` or top bar) - if you, like me, have all your notes in Anki and want to be able to look something up quickly from your phone.

### Lists

Using same ordinal clozes you can easily review lists by using `next`/`previous` keyboard shortcuts or edge taps to cycle through the clozes. Example:

```text
Step 1: {{c1:someting}}
Step 2: {{c1:someting else}}
Step 3: {{c1:someting completely different}}

```

## Configuration

Configuration is made in the note template between:

- At the top of `Front`/`Back` before the `<!-- INTERNAL -->` tag.
- In the `Styling` section.

The update logic is dependent on the user keeping these tag intact and updates will overwrite everything that is marked as internal.

- All clozes: Style by using the `.cloze` class.
- Active cloze: Cloze(s) with the current ordinal, i.e. the cloze(s) that should be answered, style by using the `.cloze-active` class.
- Inactive cloze: Cloze(s) that are not the current ordinal, i.e. the cloze(s) that should not be answered, style by using thge `.cloze-inactive` class.

## Recommended companion addons

Some useful companion addons if you, like I, keep one note per subject rather than per question:

- Review in ascedning cloze ordinal order: [Asdcending cloze reviews](https://ankiweb.net/shared/info/545968093) or [AutoReorder](https://ankiweb.net/shared/info/757527607) or similar to **review** the cards from a note in ascending cloze ordinal order as later clozes may use the answers from earlier clozes.
  - For cloze order presentation of **new** cards use the the v3 scheduler and `Deck options` as follows:

    - `New card gather order`: `Deck`
    - `New card sort order`: `Order gathered`
    - `Bury new siblings`, `Bury review siblings` and `Bury interday learning siblings`: `off`

- Sort cloze ordinals in ascending order while keeping learning state: [Sort clozes](https://ankiweb.net/shared/info/157021113)
- If you prefer note taking in markdown: [Markdown input](https://ankiweb.net/shared/info/904999275)
- If you want to maximize the note taking space in the browser: [Sidebar table](https://ankiweb.net/shared/info/1753198255)
- If you want a little more `VS Code`-y interface, consider [CSS Injector - Change default editor styles](https://ankiweb.net/shared/info/181103283) with something like:

  ```css
  /* editor.css */
  div > div.editor-field {
    border-radius: unset;
    border: none !important;
    box-shadow: none !important;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 5px;
  }
  div:not(:nth-child(1)) > .field-container {
    border-top: 1px solid var(--border);
  }

  .editor-toolbar .button-toolbar {
    border: none;
    padding: 7px 7px 0px 7px;
    margin: 0px;
  }

  .editor-field {
    --fg: #3b3b3b;
    --selected-bg: #ADD6FF80;
  }
  .night_mode .editor-field {
    --fg: #d4d4d4;
    --selected-bg: #ADD6FF26;
  }

  body {
    --fg: #3b3b3b;
    --canvas: #ffffff;
    --canvas-elevated: #ffffff;
    --border: #CECECE;
    --border-focus: 1px solid #3794ff;
  }
  body.night_mode {
    --fg: #858585;
    --canvas: #1e1e1e;
    --canvas-elevated: #1e1e1e;
    --border: #474747;
    --border-focus: 1px solid #3794ff;
  }
  ```

## Regarding styling

The default styling of the template does not look like "regular Anki clozes". You can modify the appearance with your own CSS in the `Styling` section.

## Changelog
