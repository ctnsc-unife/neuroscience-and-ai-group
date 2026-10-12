# Neuroscience & AI Group website

Static website of the Neuroscience & AI Group at the University of Ferrara.
Plain HTML, CSS and a little JavaScript. There is no build step.

## Structure

```
site/
  index.html      Home (intro, news, research, publications, join us)
  team.html       People
  research.html   Research areas and publications
  join.html       Open positions
  outreach.html   Teaching, talks, software
  contact.html    Contact details
  assets/
    css/style.css
    js/main.js    Mobile menu
    js/raster.js  Animated spike raster on the home page
    favicon.svg
.github/workflows/pages.yml   Deploys `site/` to GitHub Pages on every push to main
```

## Preview locally

```
cd site
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Edit the content

Placeholders are marked with `[Placeholder]`, `Firstname Lastname`, or `[Department name]`.
Search the `site/` folder for these and replace them with real content.

The header and footer are repeated in each HTML file. When you change the menu or
the address, update all six pages.

## Publish

In the repository on GitHub, open Settings, then Pages, and set Source to GitHub Actions.
After that every push to `main` publishes the site.
