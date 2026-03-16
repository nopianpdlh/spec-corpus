# Infrastructure Spec Index

`spec_infrastructure` is the reusable baseline for application/runtime configuration, deployment automation, environment bootstrap, and infrastructure-facing hardening guidance.

Use this file as the entry point for the infrastructure corpus after routing from the root docs.

## How to Read This Repo

There are three layers:

1. **Canonical infrastructure owners** — the local skills that own runtime configuration, deployment, bootstrap, and hardening guidance.
2. **Supporting specializations** — narrower skills that apply only inside clearly defined subdomains.
3. **Governance docs** — documents that explain precedence, adoption, and safe reuse.

If two documents seem to overlap, resolve the conflict with `DOMAIN-OWNERSHIP.md`.

## Canonical Infrastructure Owners

| Domain | Owner | Use for |
|---|---|---|
| Application and runtime configuration | `.agents/skills/environment-setup/SKILL.md` | env schema, config loading/validation, secret boundaries, per-environment runtime settings |
| Deployment and release automation | `.agents/skills/deployment-automation/SKILL.md` | build/release pipelines, promotion, rollback, health checks, deployment evidence |
| Host/system/bootstrap setup | `.agents/skills/system-environment-setup/SKILL.md` | developer machine, container/bootstrap prerequisites, local tooling, team bootstrap surfaces |
| Infrastructure-facing hardening guidance | `.agents/skills/security-best-practices/SKILL.md` | secret handling, least privilege, exposure defaults, patching/hardening guardrails |

## Owner Relationship Summary

- `environment-setup` owns the **application/runtime config model**.
- `system-environment-setup` owns **host, workstation, and team bootstrap**, not runtime config semantics.
- `deployment-automation` owns how software is built, promoted, deployed, and rolled back.
- `security-best-practices` owns infra-facing hardening guidance, but not organization-wide security policy or backend auth semantics.

## Recommended Reading Order

1. `DOMAIN-OWNERSHIP.md`
2. `NEW-PROJECT-CHECKLIST.md`
3. `environment-setup`
4. `deployment-automation`
5. `system-environment-setup` if local/bootstrap surfaces are relevant
6. `security-best-practices` when runtime or deployment hardening is in scope

## What This Repo Does Not Own

`spec_infrastructure` does **not** replace:

- frontend/backend product semantics
- organization-wide security/privacy policy
- business requirements or release approval authority
- application-level auth contract semantics already owned elsewhere

It owns infrastructure-facing implementation guidance, not every policy decision around the system.
