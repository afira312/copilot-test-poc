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
4. Add these secrets to every environment:
   - `DEPLOY_HOST`: deployment server hostname
   - `DEPLOY_USER`: deployment SSH user
   - `DEPLOY_PATH`: absolute web-root directory
   - `DEPLOY_SSH_KEY`: private SSH key for that environment
5. Add the matching public key to each target server and configure the server to serve the deployed directory.
6. Protect `develop` and `main` under **Settings > Rules > Rulesets**:
   - Require pull requests
   - Require approvals
   - Require `validate` and `workflow-security` checks
   - Require CODEOWNER review
   - Block force pushes

## Demo script

1. Create a feature branch and open a pull request.
2. Show validation, JavaScript syntax checking, secret scanning, and workflow scanning.
3. Merge into `develop` and show automatic Development then Test deployment.
4. Create `release/1.0.0` and show the Acceptance job waiting for approval.
5. Approve Acceptance, then merge the release into `main`.
6. Show Production waiting for an authorized reviewer, then approve it.
7. Demonstrate rollback by manually redeploying a previous artifact run.

The workflow uses environment-scoped secrets and does not store credentials in the repository. For cloud targets, replace the SSH composite action with the provider's OIDC-based deployment action and keep the same environment gates.