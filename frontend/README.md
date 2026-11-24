# ClaimFlow frontend

Phase 1 provides a shared responsive layout, demo identity switching and read-only previews using the real Spring Boot API. Start Spring Boot on port 8080, then run these commands from this folder.

```powershell
npm.cmd ci
npm.cmd start
```

For subsequent launches, use `npm.cmd start`. Before running `npm.cmd ci` again, stop Angular with **Ctrl+C**. On Windows a running dev server can lock `esbuild.exe` and interrupt the reinstall.

Open http://localhost:4200. Choose a demo identity to check claimant and staff navigation. With an officer selected, open **Management** to see the live dashboard summary. Visit /management with a claimant selected to check the route guard. Empty lists reflect the selected identity's current data.

- `src/styles.scss` defines the shared visual tokens and styles.
- `src/app/core/` contains API types, typed HTTP clients, error messages and demo identity handling.
- `src/app/shared/` contains layout and reusable UI components.
- `src/app/features/workspace-preview/` holds the temporary read-only pages for foundation review.
- `src/proxy.conf.json` forwards development requests to Spring Boot. Restart Angular after changing it.
- `npm.cmd test -- --watch=false` runs foundation tests. `npm.cmd run build` creates the production build.

The identity selector is for demonstration. The backend uses the selected actor header for its demo access rules.
