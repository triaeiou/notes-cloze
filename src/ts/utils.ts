/** Get closest ancestor matching supplied selector */
function ancestor(descendant: HTMLElement|null|undefined, selector: string) {
    while (descendant && !descendant.matches(selector))
            descendant = descendant.parentElement
    return descendant
}

const MODS = ['ctrl','shift','alt','meta']
/** Keyboard shortcuts and event compariosn */
function shortcut_matches(event: KeyboardEvent, shortcut: string): boolean {
    const sc = new Set(shortcut.toLowerCase().split('+'))
    return sc.has(event.key.toLowerCase()) && MODS.every(m => event[m + 'Key'] === sc.has(m))
}

export { ancestor, shortcut_matches }