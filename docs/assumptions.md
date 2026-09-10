# Assumptions

- The organization has already defined the teams and roles for release
  management.
- GitHub is used for the repository, issues, pull requests, automation, and
  approvals.
- Azure is the target platform; GitHub Pages may be used for this PoC demo.
- The delivery lifecycle has four stages: dev & test, QA, pre-prod, and prod.
- This PoC covers only the `dev -> prod` path; the other stages are future
  extensions.
- `main` is protected: no direct commits, required PR review, and required
  status checks.
- Production deployment uses a protected environment with a final required
  approval.
- A configured OpenAI-compatible endpoint is available for the PR drift check;
  its API key is stored as a GitHub environment secret.
- Terraform state is stored remotely in an Azure Storage Account and is never
  committed to the repository.
