# Deployment & Cloudflare Pages

Flixel-Pixi games and documentation sites are 100% statically buildable, making them deployable to static hosts such as **Cloudflare Pages**, **GitHub Pages**, **Vercel**, or **Netlify**.

---

## Deploying to Cloudflare Pages

### Configuration Settings

| Setting                    | Value                                     |
| :------------------------- | :---------------------------------------- |
| **Framework preset**       | `None` / `VitePress`                      |
| **Build command**          | `npm run docs:build`                      |
| **Build output directory** | `docs/.vitepress/dist`                    |
| **Node.js Version**        | `22` or `24` (set env `NODE_VERSION: 22`) |

### Environment Variables

No required backend API keys or secrets are necessary for static documentation and game hosting.

---

## Building Locally

To build the static site locally for verification:

```bash
# Generate API documentation and build static site
npm run docs:build

# Preview static distribution locally
npm run docs:preview
```
