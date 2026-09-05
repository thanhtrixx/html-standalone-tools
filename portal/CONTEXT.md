# Portal Hub Context

The **Portal Hub** is the central catalog and launcher for the HTML Standalone Tools suite hosted on GitHub Pages (`https://thanhtrixx.github.io/html-standalone-tools/`).

## Ubiquitous Language

| Term                   | Definition                                                                                                        | Avoided Synonyms                          |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------- | :---------------------------------------- |
| **Portal Hub**         | The top-level landing page (`dist/index.html`) presenting the standalone tools catalog.                           | Home page, Main website, Dashboard        |
| **Standalone Tool**    | A self-contained, zero-runtime-dependency client-side HTML web application located in its own directory.          | Plugin, Widget, Sub-module, Microfrontend |
| **Tool Card**          | A visual card component displaying an individual tool's identity, badges, description, and actions.               | App box, Tile, Item container             |
| **Direct Launch**      | One-click navigation into a tool's standalone distribution (`./<tool-name>/`).                                    | Open app, Start service                   |
| **Feature Badges**     | Metadata tags highlighting application capabilities (e.g., `PWA`, `Offline-Ready`, `Financial Modeling`).         | Labels, Tags, Flags                       |
| **Bilingual Switcher** | Instant client-side language toggle between English (`en`) and Vietnamese (`vi`) with `localStorage` persistence. | Translation bar, Language picker          |
| **Distribution Asset** | Packaged download files (`.html` and `.zip`) hosted on GitHub Releases.                                           | Binary, Downloadable package              |

## Architectural Invariants

1. **Zero Runtime Dependencies**: The compiled portal is a single static HTML file with inlined or purged styling, requiring no external JavaScript dependencies.
2. **100% Bilingual Parity**: Every UI string (titles, descriptions, badges, button labels, footer text) has complete parity between English (`en`) and Vietnamese (`vi`).
3. **Relative Path Routing**: All navigation targets use relative paths (`./<tool-name>/`) ensuring compatibility across arbitrary domain subpaths and offline local viewing.
4. **Theme Consistency**: Dark-mode aesthetic aligned with the modern slate palette (`#0b1120`, `#0f172a`, emerald accent `#10b981`) used across the tool suite.
