/**
 * IMPROVEMENTS
 * - If we consider re-adding different initial display types: add shebang syntax to set individual note options? Or use flags? Or use separate instances of note type?
 */
import {logger} from './logger'
import type { Logger } from './logger'
import {Searcher} from './searcher'
import type { Configuration } from './types'
import { ancestor } from './utils'

export class NotesCloze {
  config: Configuration
  current!: HTMLSpanElement|null
  front: boolean
  log: Logger
  search: Searcher
  content: HTMLDivElement
  viewport: HTMLDivElement
  observer?: MutationObserver

  constructor(config: Configuration, front: boolean) {
    this.config = config
    this.front = front

    // get the element references and remove this.viewport before manipulation
    this.viewport = document.getElementById('nc-viewport') as HTMLDivElement
    const parent = this.viewport.parentElement! as HTMLElement
    const title = document.getElementById('nc-title') as HTMLHeadingElement
    this.content = document.getElementById('nc-content')! as HTMLDivElement
    let pre = document.getElementById('nc-log-panel') as HTMLPreElement
    this.viewport.remove()

    this.viewport.classList.remove(front ? 'back' : 'front')
    this.viewport.classList.add(front ? 'front' : 'back')

    if (this.config.log_level && !pre) {
      pre = document.createElement('pre')
      pre.id = 'nc-log-panel'
      pre.hidden = true
      pre = parent.appendChild(pre)
    }

    // setup logging
    this.log = logger(pre, config?.log_level)

    // default title is deck name, replace with note title if exists
    const h1 = this.content.querySelector('h1') as HTMLHeadingElement
    if (h1) {
      title.innerText = h1.innerText
      h1.remove()
    }

    // parse content, move content and hint into separate spans to allow css rules for hiding showing:
    // setting .hide on the wrapper hides content and shows hint
    // reassigns classes: .cloze: active and inactive, .cloze-active/.cloze-inactive, .cloze-hint/.cloze-content
    // front: one: <span class="cloze" data-cloze="<br>two: <span class=&quot;cloze-inactive&quot; data-ordinal=&quot;2&quot;>three <span class=&quot;cloze-inactive&quot; data-ordinal=&quot;3&quot;>four</span> five</span><br>" data-ordinal="1">[...]</span><br><span class="cloze-inactive" data-ordinal="4">six</span>
    // back: one: <span class="cloze" data-ordinal="1"><br>two: <span class="cloze-inactive" data-ordinal="2">three <span class="cloze-inactive" data-ordinal="3">four</span> five</span><br></span><br><span class="cloze-inactive" data-ordinal="4">six</span><br>
    // front active have dataset.cloze
    // all have dataset.ordinal on both sides

    // recursivel expand all content hidden in active clozes dataset.cloze on the front and save the hint
    if (front) {
      function unwrap(cloze: HTMLSpanElement) {
        const hint = cloze.innerHTML.slice(1, cloze.innerHTML.length - 1) || ''
        cloze.dataset.hint = hint === '...' ? '' : hint
        cloze.innerHTML = cloze.dataset.cloze!
        // Recursively process nested .cloze elements
        for (const nested of cloze.querySelectorAll('.cloze') as NodeListOf<HTMLSpanElement>)
          unwrap(nested)
      }

      for (const cloze of this.content.querySelectorAll('.cloze') as NodeListOf<HTMLSpanElement>)
        unwrap(cloze)
    }

    // wrap cloze content and hint in new span:
    // <span class="cloze cloze-active"><span class="cloze-hint">hint</span><span class="cloze-content">content</span></span>
    for (const cloze of this.content.querySelectorAll('.cloze-inactive, .cloze') as NodeListOf<HTMLSpanElement>) {
      const type = cloze.classList.contains('cloze') ? 'cloze' : 'cloze-inactive'
      const wrap = document.createElement('span')
      wrap.classList.add('cloze', type === 'cloze' ? 'cloze-active' : 'cloze-inactive')
      cloze.replaceWith(wrap)
      const hint = wrap.appendChild(document.createElement('span'))
      hint.classList.add('cloze-hint')
      hint.innerText = cloze.dataset.hint || ''
      cloze.classList.replace(type, 'cloze-content')
      wrap.appendChild(cloze)
      if (front) wrap.classList.add('hide')
      // capture first active cloze
      if (type === 'cloze') this.current ||= wrap

    }

    // listeners
    document.addEventListener("click",  this.mouse.bind(this)) // bind so this refers to NotesCloze instance not clicked element
    document.addEventListener("keydown", this.keyboard.bind(this)) // bind so this refers to NotesCloze instance not clicked element

    // reveal finished content and scroll to first active cloze
    parent.appendChild(this.viewport)
    this.search = new Searcher(this.viewport, 'nc-', this.log)
    this.viewport.appendChild(this.search.element)
    this.viewport.style.display = 'flex'

    // on front: scroll to context and set up storing of scroll position on destroy
    // on back: restore previous scroll position and then scroll into view
    if (front) {
      this.viewport.onscroll = () => {
        const center = this.viewport.scrollTop + this.viewport.clientHeight / 2
        let ix = 0
        let offset = title.clientHeight
        for (const [i, el] of Array.from(this.content.querySelectorAll('.cloze-active') as NodeListOf<HTMLSpanElement>).entries()) {
          console.log(`checking ${i} with center: ${center}, el.offsetTop: ${el.offsetTop}`)
          const top = el.getBoundingClientRect().top
          if (top >= title.clientHeight) {
            ix = i
            offset = top
            break
          }
        }
    
        console.log(`storing ${ix} with offset ${offset}`)
        sessionStorage.setItem('nc_reference_ordinal', ix.toString())
        sessionStorage.setItem('nc_reference_offset', offset.toString())
      }

      // initial scroll
      window.requestAnimationFrame(() => this.scroll_to('context', this.current!))

    } else {
      const ord = parseInt(sessionStorage.getItem('nc_reference_ordinal')!)
      const offset = parseFloat(sessionStorage.getItem('nc_reference_offset')!)
      const actives = this.content.querySelectorAll('.cloze-active') as NodeListOf<HTMLSpanElement>
      const ref = actives[ord]!
      let pos = ref.offsetTop
      let el = ref.parentElement!
      while (el !== this.content) {
        pos += el.offsetTop
        el = el.parentElement!
      }
      // render then scroll to previous position
      window.requestAnimationFrame(() => {
        console.log(`scrolling to ${pos - offset} from position ${pos} and offset ${offset}`)
        this.scroll_to('position', pos - offset)
        // render then scroll into view
        window.requestAnimationFrame(() => {
          const first = actives[0].getBoundingClientRect()
          const last = actives[actives.length - 1].getBoundingClientRect()
          if (first.top >= 0 && last.bottom <= this.viewport.clientHeight) {
            console.log(`all visible, first.top: ${first.top}, last.bottom: ${last.bottom}, viewport: ${this.viewport.clientHeight}`)
            return
          }
          else if (first.top < 0 || (first.top - last.bottom) > this.viewport.clientHeight){
            console.log(`scrolling to first: ${first.top}, last: ${last.bottom}, viewport: ${this.viewport.clientHeight}`)
            this.scroll_to('min', actives[0])
          }
          else {
            console.log(`scrolling to last: ${first.top}, last: ${last.bottom}, viewport: ${this.viewport.clientHeight}`)
            this.scroll_to('min', actives[actives.length - 1])
          }
        })
      }) 
    }
  }


  /** Show cloze */
  show(cloze: HTMLSpanElement) {
    this.log('show', cloze.tagName)
    cloze.classList.remove('hide')
  }


  /** Hide cloze */
  hide(cloze: HTMLSpanElement) {
    this.log('hide')
    cloze.classList.add('hide')

    if (!this.search.hidden) this.search.hidden = true
  }


  /** Toggle cloze visibility of specified cloze or all
   * @param action target cloze or true/false for force show when toggling all
   * @returns whether resulting action was show or not
   * */
  toggle(action: HTMLSpanElement|boolean): boolean {
    this.log('toggle: ', action)
    if (action instanceof HTMLSpanElement) {
      const hidden = action.classList.contains('hide')
      if (hidden) this.show(action)
      else this.hide(action)
      return hidden
    } else {
      if (action || this.search.hidden || this.content.querySelector('.hide')) {
        for (const cloze of this.content.querySelectorAll('.hide') as NodeListOf<HTMLSpanElement>)
          this.show(cloze)
        this.search.hidden = false
        this.search.focus()
        return true
      } else {
        for (const cloze of this.content.querySelectorAll('.cloze:not(.hide)') as NodeListOf<HTMLSpanElement>)
          this.hide(cloze)
        this.search.hidden = true
        return false
      }
    }
  }


  /** Iterate forward or backward, start by showing this.current if hidden */
  iter(fwd: boolean) {
    this.log('iter')
    const clozes = Array.from(this.content.querySelectorAll('.cloze-active') as NodeListOf<HTMLSpanElement>)

    let current: HTMLSpanElement|undefined, next: HTMLSpanElement|undefined
    for (current of (fwd ? clozes.slice().reverse() : clozes)) {
      if (!current.classList.contains('hide')) break
      next = current
    }
    next ||= fwd ? clozes[0] : clozes[clozes.length - 1]
    if (current === next) this.toggle(next)
    else if (next === clozes[0]) this.hide(current!)
    else {
      this.show(next)
      this.hide(current!)
    }
    this.current = next
    this.scroll_to('min', this.current)
  }


  /** Calculate line height from style */
  line_height(element: Element): number {
    this.log('    line_height')
    let prev = element.previousElementSibling
    if (!prev) return 0
    while (prev.lastElementChild) prev = prev.lastElementChild
    const rects = prev.getClientRects()
    for (const rect of Array.from(rects).reverse()) {
      if (rect.height > 0) return rect.height + (element.getClientRects()[0].top - rect.bottom) * 1.5
    }
    return 0
  }


  /** Scroll to active clozes or specific cloze */
  scroll_to(type: 'min'|'context'|'position', target: HTMLSpanElement|HTMLSpanElement[]|number): void {
    this.log('scroll_to')
    const title_offset = this.viewport.firstElementChild!.clientHeight

    if (type === 'position') {
      this.log(`    scrolling to ${target as number}`)
      this.viewport.scrollTop = target as number
    } else { // context or min

      // identify top and bottom of area to visualize
      let first, last
      let top = 0, bottom = 0 // viewport coordinates
      if (target instanceof HTMLSpanElement) {
        first = last = target
        bottom = target.getBoundingClientRect().bottom
      } else {
        first = target![0]
        for (const t of target as HTMLSpanElement[]) {
          const b = t.getBoundingClientRect().bottom
          if (b < bottom) continue
          bottom = b
          last = t
        }
      }

      let section: HTMLElement|undefined
      // find section start if relevant
      if (type === 'context') {
        const walker = document.createTreeWalker(
          this.content, NodeFilter.SHOW_ELEMENT,
          {
            acceptNode(nd: HTMLElement) {
              return nd.matches('hr, h1, h2, h3, h4, h5, h6')
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_SKIP
            }
          }
        )
        walker.currentNode = first
        section = walker.previousNode() as HTMLElement
      }
      const lineh = this.line_height(first || 19)

      if (section) {
        top = section.tagName === 'HR'
          ? section.getBoundingClientRect().bottom
          : section.getBoundingClientRect().top - lineh
      } else {
        top = first.getBoundingClientRect().top - lineh
      }

      // convert to parent coordinates
      top += this.viewport.scrollTop
      bottom += this.viewport.scrollTop + lineh // add lineh padding to bottom

      if (bottom - top > this.viewport.clientHeight - title_offset) { // will not fit, scroll to top
        this.viewport.scrollTop = top - title_offset
      } else { // will fit, scroll as little as possible
        if (top < this.viewport.scrollTop + title_offset)
          this.viewport.scrollTop = top - title_offset
        else if (bottom > this.viewport.scrollTop + this.viewport.clientHeight)
          this.viewport.scrollTop = bottom - this.viewport.clientHeight
      }
    }
  }


  /** Handle document level mouse events */
  mouse(evt: MouseEvent) {
    this.log('mouse event')
    let target
    evt
    // viruall toggle all "bar" handling
    if ((evt.target as HTMLElement).id === 'nc-title') {
      if (this.search.hidden = !this.toggle(false)) this.search.focus()

    } else if (this.content.contains(evt.target as Node)) {
      const rect = this.content.getBoundingClientRect()
      if (evt.x <= rect.left + 30) this.iter(false)
      else if (evt.x >= rect.right - 30) this.iter(true)
      else if (target = ancestor(evt.target as HTMLElement, '.cloze, .cloze-inactive')) {
        // Cloze click handling
        evt.stopPropagation() // avoid toggling parents
        if (!document.getSelection()?.toString()) { // avoid toggling when copying text
          this.current = target
          if (this.toggle(target)) this.scroll_to('min', target)
        }
      }
    }
  }

  /** Handle document level keyboard events */
  keyboard(evt: KeyboardEvent) {
    this.log('keyboard event')
    if (evt.key === 'Escape' && !this.search.hidden) {
      this.search.hidden = true
      evt.stopImmediatePropagation()
    }
    else if (evt.key === this.config.shortcuts.next) this.iter(true)
    else if (evt.key === this.config.shortcuts.previous) this.iter(false)
    else if (evt.key === this.config.shortcuts.toggle_all) this.toggle(false)
    else if (evt.key === 'f' && evt.ctrlKey && !evt.metaKey) {
      if (this.search.hidden) this.toggle(true)
      this.search.focus()
    } else if (evt.key === 'ArrowUp') {
      this.content.scrollTop -= this.line_height(this.current?.previousElementSibling || this.current!)
    } else if (evt.key === 'ArrowDown') {
      this.content.scrollTop += this.line_height(this.current?.nextElementSibling || this.current!)
    }
    else if (evt.key === 'PageUp') this.content.scrollTop -= this.content.clientHeight
    else if (evt.key === 'PageDown') this.content.scrollTop += this.content.clientHeight
    else return

    // All non-handled events returned above
    evt.stopPropagation()
    evt.preventDefault()
  }
}

