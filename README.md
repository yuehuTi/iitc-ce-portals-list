# IITC-CE source form of Portals list

Converted from the Tampermonkey userscript for a PR against
[IITC-CE/ingress-intel-total-conversion](https://github.com/IITC-CE/ingress-intel-total-conversion).

## Files

- `portals-list.js` → copy to `plugins/portals-list.js`
- `portals-list.css` → copy to `plugins/portals-list.css`

## Build

From an IITC-CE checkout:

```bash
python3 build_plugin.py release plugins/portals-list.js --out-dir /tmp/iitc-out
```

Install `/tmp/iitc-out/portals-list.user.js` to verify.

## Notes

- Wrapper / `==UserScript==` extras / `bootPlugins` inject are omitted (added by the build).
- CSS is loaded via `@include_string:portals-list.css@`.
- This is a large update over upstream `0.4.6`; expect review discussion.
