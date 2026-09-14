# Translations

[Documentation index](README.md) · [Project README](../README.md)

Translation source files are JSON under [`src/translations-json`](../src/translations-json). English (`EN`) is the source language. Files are grouped by Project Zomboid namespace, currently `UI.json` and `Tooltip.json`; keep the same keys in translated files. For example, `Tooltip_BorisBadger` belongs in `Tooltip.json`.

To add or improve a locale, create or edit `src/translations-json/<LOCALE>/UI.json` and `Tooltip.json` using the English keys, then review the text in-game. Project Zomboid locale codes are used for directory names; the translation script maps `pt` to `PTBR` and `zh` to `CN`.

`npm run build` transpiles the mod and runs `scripts/postbuild.js`. The base package copies **EN only** into `dist/Naninhas/42/media/lua/shared/Translate/EN/`. Other languages are distributed as separate translation packages. Do not edit `dist/` as the source of a translation.

For a locale package, run `npm run translate -- <language>` (for example, `npm run translate -- pt`). This writes `dist/Naninhas - <LOCALE>/42/media/lua/shared/Translate/<LOCALE>/`. The script retains existing generated strings, then uses reviewed locale JSON, and machine-translates missing English keys. Review generated strings before publishing; the script can call an external translation service.

The current Brazilian Portuguese package is linked from the [project README](../README.md#-translations). Packaging scripts also expose `zip:translation` and `steam:translate` for distribution.
