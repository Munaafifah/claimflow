# ClaimFlow frontend

The claimant portal uses the real Spring Boot API to submit and track claims, reply to information requests, and see decisions. The officer and management routes currently provide read-only previews. Start Spring Boot on port 8080, then run these commands from this folder.

```powershell
npm.cmd ci
npm.cmd start
```

For subsequent launches, use `npm.cmd start`. Before running `npm.cmd ci` again, stop Angular with **Ctrl+C**. On Windows a running dev server can lock `esbuild.exe` and interrupt the reinstall.

Open http://localhost:4200. Choose **Claimant 1** or **Claimant 2** in the demo identity selector.

1. On **Overview**, check the summary and use **Submit a claim** to report a motor or property incident.
2. After submission, open **My Claims**. Filter by type or status and choose a claim ID to open its details and history.
3. Use `claimflow.http` to pick up a demo claim as an officer and request information. Refresh the claimant detail to see and answer the request. Use the officer requests to record an approval, rejection or settlement and refresh again to see the outcome.
4. Switch claimants while viewing a detail page to check claim ownership. With an officer selected, **Management** shows the current team summary.

Overview counts treat claims waiting for claimant information as **Action required**, and settled or rejected claims as **Completed**. The remaining claims are **In progress**, including approved claims awaiting settlement.

- `src/styles.scss` defines the shared visual tokens and styles.
- `src/app/core/` contains API types, typed HTTP clients, error messages and demo identity handling.
- `src/app/shared/` contains layout and reusable UI components.
- `src/app/features/claimant/` holds the claimant pages and form validation. `src/app/features/workspace-preview/` still serves the officer and management previews.
- `src/proxy.conf.json` forwards development requests to Spring Boot. Restart Angular after changing it.
- `npm.cmd test -- --watch=false` runs foundation tests. `npm.cmd run build` creates the production build.

The identity selector is for demonstration. The backend uses the selected actor header for its demo access rules.
