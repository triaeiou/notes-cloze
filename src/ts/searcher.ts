import type {Logger} from './logger'
/**
 * Initializes and returns search function interface, default method is search
 * Credit Julien Grégoire: https://stackoverflow.com/questions/58553501/how-to-highlight-search-text-from-string-of-html-content-without-breaking
 */
export class Searcher {
  element: HTMLDivElement
  content: HTMLElement
  field!: HTMLInputElement
  button!: HTMLElement
  class_: {match: string, matches: string}
  sstr!: string
  highlights!: HTMLElement[]
  index!: number
  log!: Logger

  constructor(content: HTMLElement, prefix: string, logger: Logger = ((() => {}) as any)) {
    logger('searcher.constructor()')
    this.element = document.createElement('DIV') as HTMLDivElement
    this.element.style.display = 'none'
    this.element.id = `${prefix}search`
    this.element.innerHTML = `<input type="text" class="field" placeholder="Search for text"/><div class="button" tabindex="0">Search</div>`
    this.field = this.element.firstElementChild as HTMLInputElement
    this.field.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') {
        this.search()
        // for some reason keyboard input is lost on Desktop so we need to reset it
        this.button.focus() // on mobile we want to hide keyboard and use button
        if (!document.documentElement.classList.contains('mobile')) this.field.focus()
      } else if (evt.key === 'Escape') return
      evt.stopPropagation()
    })
    this.button = this.element.lastElementChild as HTMLDivElement
    this.button.onclick = () => {this.search()}
    this.field.onfocus = () => {this.field.select()}

    this.content = content
    this.log = logger
    this.highlights = [], this.index = -1, this.sstr = ''
    this.class_ = {
      match: prefix + 'search-match',
      matches: prefix + 'search-matches'
    }
  }

  search() {
    this.log('searcher.search')
    // Nothing in search field - clear
    if (!this.field?.value) {
      this.clear()
      return
    }

    // Changed search string, clear old and create new searh
    if (this.field.value !== this.sstr) {
      this.clear()
      this.sstr = this.field.value
      this.highlight(RegExp(this.sstr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'gi'))
    }

    // If we have matches, clear previous highlight, highlight next and scroll
    if (this.highlights?.length) {
      if (this.index >= 0)
        this.highlights[this.index].classList.replace(this.class_.match, this.class_.matches)
      this.index = this.index < this.highlights.length - 1
        ? this.index + 1
        : 0
      this.highlights[this.index].classList.replace(this.class_.matches, this.class_.match)
      this.highlights[this.index]
      .scrollIntoView({behavior: 'auto', block: 'center', inline: 'nearest'})
    }
  }

  highlight(re: RegExp) {
    this.log('searcher.highlight')
    const txt = this.content.textContent!
    const stl = getComputedStyle(this.content)

    const offset = {
      top: this.content.scrollTop - parseFloat(stl.marginTop), // - rct.top
      left: this.content.scrollLeft - parseFloat(stl.marginLeft) // - rct.left
    }
    const sel = window.getSelection()!
    sel.removeAllRanges()
    let match, sstr = this.field.value
    // to handle multiple result you need to go through all matches
    while (match = re.exec(txt)) {
      const itr = nd_itr(this.content)
      let index = 0
      // the result is the text node, so you can iterate and compare the index you are searching to all text nodes length
      let res = itr.next()
      while (!res.done) {
        let rng
        if (match.index >= index && match.index < index + res.value.length) {
          // when we have the correct node and index we add a range
          rng = new Range()
          rng.setStart(res.value, match.index - index)
        }
        if (
          match.index + sstr.length >= index &&
          match.index + sstr.length <= index + res.value.length &&
          rng
        ) {
          // when we find the end node, we can set the range end
          rng.setEnd(res.value, match.index + sstr.length - index)
          sel.addRange(rng)
          // this is where we add the divs based on the client rects of the range
          for (const rect of rng.getClientRects()) {
            const light = document.createElement('DIV')
            // light.innerText = rng.toString()
            this.content.appendChild(light)
            light.classList.add(this.class_.matches)
            light.style.top = rect.y + offset.top + 'px'
            light.style.left = rect.x  + offset.left + 'px'
            light.style.height = rect.height + 'px'
            light.style.width = rect.width + 'px'
            this.highlights.push(light)
          }
        }
        index += res.value.length
        res = itr.next()
      }
    }
    sel.removeAllRanges()

    /** Iterate all descendents */
    function* nd_itr(nd: Node) {
      for (const cnd of nd.childNodes) {
        if (cnd.nodeType === Node.TEXT_NODE) yield cnd
        else yield* nd_itr(cnd)
      }
    }
  }

  clear() {
    this.log('searcher.clear')
    for (const el of this.highlights) el.remove()
    this.index = -1, this.sstr = '', this.highlights = []
  }

  focus() {
    this.log('searcher.focus')
    this.field.focus()
  }

  get hidden(): boolean {return this.element.style.display === 'none'}
  set hidden(value: boolean) {
    if (value) {
      this.element.style.display = 'none'
      this.clear()
    }
    else this.element.style.display = 'flex'
  }
}