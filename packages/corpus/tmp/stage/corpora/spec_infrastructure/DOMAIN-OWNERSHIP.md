# Domain Ownership and Precedence

This file defines which document owns which infrastructure domain and how to resolve overlap.

## Precedence Rules

1. **The canonical infrastructure owner wins inside its domain.**
2. **Runtime configuration, deployment, bootstrap, and hardening are separate decision surfaces and must not silently replace each other.**
3. **Infrastructure guidance does not take over product semantics, backend auth semantics, or organization-wide security policy.**
4. **External spec repositories keep ownership of their own domains** (backend, frontend, security/policy, product, QA).
5. **Repeated ambiguity must be written back into this file and the relevant skill.**

## Infrastructure-Owned Domains

| Domain | Canonical owner | Includes | Explicitly does not own |
|---|---|---|---|
| Application and runtime configuration | `.agents/skills/environment-setup/SKILL.md` | env variable schema, config loading/validation, runtime secrets boundaries, per-environment config contracts | workstation bootstrap, deployment orchestration, backend auth semantics |
| Deployment and release automation | `.agents/skills/deployment-automation/SKILL.md` | CI/CD pipelines, artifact promotion, rollout/rollback, deployment checks, post-deploy verification | defining runtime config schema, owning security policy, product release approval |
| Host/system/team bootstrap | `.agents/skills/system-environment-setup/SKILL.md` | local machine prerequisites, dev containers, bootstrap scripts, team environment tooling, local infra bring-up | application runtime config ownership, production deploy policy |
| Infrastructure-facing hardening guidance | `.agents/skills/security-best-practices/SKILL.md` | secret handling hygiene, least privilege, surface reduction, patching/update posture, runtime/deploy hardening guardrails | org-wide security policy, auth contract semantics, privacy policy ownership |

## Practical Boundary Rules

- If the question is **which env vars/config values exist and how the app reads them**, `environment-setup` owns it.
- If the question is **how artifacts are built, promoted, deployed, or rolled back**, `deployment-automation` owns it.
- If the question is **what machines, containers, or local bootstrap tooling contributors need**, `system-environment-setup` owns it.
- If the question is **how the infra/runtime surface is hardened**, `security-best-practices` owns it.

## Cross-Owner Examples

- **A local bootstrap script introduces a new env variable** → `system-environment-setup` can automate setup, but `environment-setup` still owns the runtime config contract.
- **A deployment pipeline injects secrets differently in staging and production** → `deployment-automation` owns rollout behavior, while `environment-setup` still owns the config shape and validation rules.
- **A hardening guide recommends token changes visible to clients** → `security-best-practices` can flag risk, but backend/security-policy owners still own auth semantics.
- **A dev container bundles extra local services** → `system-environment-setup` owns the local bootstrap shape; it does not become the production deployment owner.

## External Domain Ownership

| External domain | Owned outside `spec_infrastructure` | Infrastructure responsibility |
|---|---|---|
| Backend/frontend semantics | `spec_backend`, `spec_frontend`, or domain repos | provide runtime/deploy/config support without redefining behavior |
| Security/privacy policy | security/privacy spec | implement hardening guidance that aligns with policy without claiming policy ownership |
| Product / release authority | PRD/release owner | provide deploy/config evidence; do not decide product release scope |

## Conflict Resolution Workflow

1. identify whether the dispute is about config, deployment, bootstrap, or hardening
2. apply the owner for that specific surface
3. defer semantic truth and policy to the relevant external owner when needed
4. update this file if the same overlap appears again
