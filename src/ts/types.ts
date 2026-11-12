export interface Configuration {
  shortcuts: {
    next: string        // Iterate to next cloze
    previous: string    // Iterate to previous cloze
    toggle_all: string  // Toggle all clozes and fields
  }
  inactive: {
      front: boolean    // show inactive on front
      back: boolean     // show inactive on back
  }
  log_level: undefined|boolean|'error'    // Logging level (`false`, `'error'` or `true`)
}
