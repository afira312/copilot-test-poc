# DTAP deployment POC

This repository now contains a GitHub Actions promotion pipeline for the static site.

## Promotion flow

```text
pull request -> CI and security checks
develop      -> Development -> Test
release/*    -> Acceptance (approval required)
main         -> Production (approval required)
```

The site is packaged once per commit. The same artifact is promoted to each environment; it is not rebuilt between stages.

## One-time GitHub setup

1. In **Settings > Environments**, create `Development`, `Test`, `Acceptance`, and `Production`.
2. Add required reviewers to `Acceptance` and `Production`.
3. Restrict each environment to the appropriate branch pattern:
   - `Development` and `Test`: `develop`
   - `Acceptance`: `release/*`
   - `Production`: `main`
4. In **Settings > Pages**, set **Source** to **GitHub Actions**.
5. Protect `develop` and `main` under **Settings > Rules > Rulesets**:
   - Require pull requests
   - Require approvals
   - Require `validate` and `workflow-security` checks
   - Require CODEOWNER review
   - Block force pushes

## Demo script

1. Create a feature branch and open a pull request.
2. Show validation, JavaScript syntax checking, secret scanning, and workflow scanning.
3. Merge into `develop` and show automatic Development then Test artifact promotion.
4. Create `release/1.0.0` and show the Acceptance job waiting for approval.
5. Approve Acceptance, then merge the release into `main`.
6. Show Production waiting for an authorized reviewer, then approve it to deploy GitHub Pages.
7. Demonstrate rollback by manually redeploying a previous artifact run.

The workflow promotes one immutable artifact through the DTAP stages and uses GitHub's OIDC-based Pages deployment. No deployment credentials are stored in the repository.