import { nodeResolve } from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import copy from "rollup-plugin-copy-merge"
import fs from "fs-extra"
import terser from "@rollup/plugin-terser"

export default [
  {
    input: "src/ts/nc.ts",
    output: {
      file: "./build/nc.js",
      format: "iife",
      name: "nclib",
    },
    plugins: [
      typescript(),
      nodeResolve({ preferBuiltins: false, browser: true }),
      //terser({format: {comments: false}}),
      copy({
        hook: "writeBundle",
        targets: [
          {
            src: "src/html/nc.html",
            dest: "bin",
            rename: "nc-front.html",
            transform: async (html) => {
              return [
                '<!-- CONFIGURATION -->',
                '<script type="application/javascript">',
                  (await fs.readFile("src/cfg/cfg.js", "utf-8")).toString().trim(),
                '</script>',
                '<!-- INTERNAL -->',
                html,
                '<!-- functional js -->',
                '<script type="application/javascript">',
                  (await fs.readFile("build/nc.js", "utf-8")).toString().trim(),
                  "var nc = new nclib.NotesCloze(config, true);",
                '</script>',
              ].join("\n\n")
            }
          }
        ]
      }),
      copy({
        hook: "writeBundle",
        targets: [
          {
            src: "src/html/nc.html",
            dest: "bin",
            rename: "nc-back.html",
            transform: async (html) => {
              return [
                '<!-- CONFIGURATION -->',
                '<script type="application/javascript">',
                  (await fs.readFile("src/cfg/cfg.js", "utf-8")).toString().trim(),
                '</script>',
                '<!-- INTERNAL -->',
                html,
                '<!-- functional js -->',
                '<script type="application/javascript">',
                  (await fs.readFile("build/nc.js", "utf-8")).toString().trim(),
                  "var nc = new nclib.NotesCloze(config, false);",
                '</script>',
              ].join("\n\n")
            }
          }
        ]
      }),
      copy({
        hook: "closeBundle",
        targets: [
          {
            src: "src/html/debug.html",
            dest: "debug",
            rename: "debug-front.html",
            transform: async (html_head) => {
              return [
                html_head,
                  '<div id="qa" style="opacity: 1;">',
                    '<style>',
                      (await fs.readFile("bin/nc.css", "utf-8")).toString().trim(),
                    '</style>',
                    (await fs.readFile("bin/nc-front.html", "utf-8"))
                      .toString()
                      .replace('{{cloze:Text}}', `<h1>A title</h1>With: <span class="cloze-inactive" data-ordinal="1">one</span><br>And: <span class="cloze-inactive" data-ordinal="2">another</span><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>Some: <span class="cloze" data-cloze="<br><br>nested: <span class=&quot;cloze&quot; data-cloze=&quot;items&quot; data-ordinal=&quot;3&quot;>[...]</span><br>with: <span class=&quot;cloze&quot; data-cloze=&quot;same&quot; data-ordinal=&quot;3&quot;>[...]</span><br><br>" data-ordinal="3">[...]</span><br><br>as: <span class="cloze-inactive" data-ordinal="4"><br><br>well: <span class="cloze-inactive" data-ordinal="5">as ascending</span><br>items: <span class="cloze-inactive" data-ordinal="6">in</span><br><br></span>`)
                      //.replace('{{cloze:Text}}', `<h1>A title</h1>With: <span class="cloze" data-cloze="one" data-ordinal="1">[...]</span><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>And: <span class="cloze-inactive" data-ordinal="2">another</span><br>Some: <span class="cloze-inactive" data-ordinal="3"><br><br>nested: <span class="cloze-inactive" data-ordinal="3">items</span><br>with: <span class="cloze-inactive" data-ordinal="3">same</span><br><br></span><br><br>as: <span class="cloze-inactive" data-ordinal="4"><br><br>well: <span class="cloze-inactive" data-ordinal="5">as ascending</span><br>items: <span class="cloze-inactive" data-ordinal="6">in</span><br><br></span>`)
                      .trim(),
                  '</div>',
                '</body></html>'
              ].join("\n\n")
            }
          }
        ]
      })
    ]
  }
]
