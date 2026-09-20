# Jiaxing Zhang — Terminal homepage

A small, browser-based terminal at [chocolate213.github.io](https://chocolate213.github.io/).

Try `whoami`, `projects`, `project stay-awake`, `open json-formatter`, or `help`. Includes a virtual filesystem, command history, Tab completion, and green / amber / ice themes.

## Local preview

```sh
python3 -m http.server 9530 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:9530`. No dependencies or build step.

## Verification

```sh
node --test tests/*.test.mjs
```

## Public information only

Profile and project data in `site/terminal.mjs` are curated from the public [GitHub profile](https://github.com/chocolate213) and the two pinned public repositories. No private repositories, local paths, employer details, or additional personal information are included.

Commands run entirely in the browser. There is no shell access, analytics, backend, or runtime API request. Command history stays in memory for the current tab; only the selected color theme is saved locally. `open` and links navigate to the public destinations shown.

## Deployment

GitHub Pages publishes only `site/` using `.github/workflows/pages.yml`. Set the repository’s Pages source to **GitHub Actions**. Changes to `master` run the command tests before deployment.
