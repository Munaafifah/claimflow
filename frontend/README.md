# ClaimFlow frontend

The Angular app serves claimant, officer and management views using the Spring Boot API. See the [root README](../README.md) for prerequisites and startup. Follow the [demonstration guide](../docs/DEMO.md) with claims created in your own checkout.

- `src/styles.scss` defines the shared visual tokens and styles.
- `src/app/core/` contains API types, HTTP clients, error messages and demo identity handling.
- `src/app/shared/` contains the layout and reusable UI components.
- `src/app/features/` contains claimant, officer and management pages.
- `src/proxy.conf.json` forwards development requests to Spring Boot. Restart Angular after changing it.

Run `npm test -- --watch=false` for the frontend tests and `npm run build` for the production bundle. In Windows PowerShell use `npm.cmd`. Stop Angular before reinstalling dependencies.

The Management date form uses inclusive UTC calendar dates. Angular sends midnight of the day after the selected end date as the API's exclusive upper bound. Date filters affect performance only. Manual and 30-second refreshes update the timestamp on success. If a refresh fails, the last successful report remains visible.
