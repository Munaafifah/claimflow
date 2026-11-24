# ClaimFlow frontend

The portals use the real Spring Boot API. Claimants can submit and track claims, reply to information requests, and see decisions. Officers can pick up and review claims from a shared worklist and see management reporting. Start Spring Boot on port 8080, then run these commands from this folder.

```powershell
npm.cmd ci
npm.cmd start
```

For subsequent launches, use `npm.cmd start`. Before running `npm.cmd ci` again, stop Angular with **Ctrl+C**. On Windows a running dev server can lock `esbuild.exe` and interrupt the reinstall.

Open http://localhost:4200. Choose **Claimant 1** or **Claimant 2** in the demo identity selector.

1. On **Overview**, check the summary and use **Submit a claim** to report a motor or property incident.
2. After submission, open **My Claims**. Filter by type or status and choose a claim ID to open its details and history.
3. Use the officer worklist to pick up a demo claim and request information. Switch back to the owning claimant, open the detail and send a reply. Switch to the assigned officer, find the claim in **Assigned to Me**, resume review, and record a decision.
4. Switch claimants while viewing a detail page to check claim ownership. With an officer selected, **Management** shows current claims, workload, historical performance and estimated exposure by currency.

Overview counts treat claims waiting for claimant information as **Action required**, and settled or rejected claims as **Completed**. The remaining claims are **In progress**, including approved claims awaiting settlement.

- `src/styles.scss` defines the shared visual tokens and styles.
- `src/app/core/` contains API types, typed HTTP clients, error messages and demo identity handling.
- `src/app/shared/` contains layout and reusable UI components.
- `src/app/features/claimant/` holds the claimant pages and form validation. `src/app/features/officer/` holds the worklist, review page, action rules, and approval validation. `src/app/features/dashboard/` holds the Management view and display formatting.
- `src/proxy.conf.json` forwards development requests to Spring Boot. Restart Angular after changing it.
- `npm.cmd test -- --watch=false` runs foundation tests. `npm.cmd run build` creates the production build.

The identity selector is for demonstration. The backend uses the selected actor header for its demo access rules.

## Walk through Claim #34

1. As **Officer 1**, open **Claims worklist → Incoming Claims → #34**. Pick up the claim. Request information, for example “Please share the repair estimate.”
2. As **Claimant 1**, open **My Claims → #34**. Send a reply, for example “The repair estimate is MYR 500.”
3. As **Officer 1**, open **Assigned to Me → #34**. Resume review, then approve up to MYR 500 with a reason.
4. As **Claimant 1**, open #34 to see the approval. As **Officer 1**, return to #34, select **Record settlement**, and confirm. Check the final status and full timeline as either actor.
5. To test rejection, use a separate demo claim. Rejection and settlement are terminal.

## Verify Management

1. Select an officer and open **Management**. Compare the four cards, workload, exposure, outstanding groups and outcome tables with **Dashboard 2** in `claimflow.http`. The status bars group the API's outstanding rows by status and use the outstanding count as the denominator.
2. Choose a UTC date range and apply it. The end day is inclusive in the form, and Angular sends midnight of the following day as the API's exclusive upper bound. The date range changes performance results. Clear it to return to all time.
3. Click **Refresh**, then leave the page open for 30 seconds. **Last updated** advances on a successful response. If the backend cannot be reached during a refresh, the last successful results stay visible with an error message.
