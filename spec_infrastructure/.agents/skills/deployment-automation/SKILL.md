---
name: deployment-automation
description: Own deployment and release automation guidance. Use when defining build, promotion, rollout, rollback, and post-deploy verification paths without redefining runtime config or product release authority.
metadata:
  tags: deployment, automation, rollout, rollback, ci-cd
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Deployment Automation

`deployment-automation` is the canonical infrastructure owner for deployment and release automation.

It owns how artifacts are built, promoted, deployed, rolled back, and verified after deployment. It does **not** own runtime config schema, workstation bootstrap, or product release approval authority.

## Use this skill when

- designing a CI/CD or promotion path
- defining rollout and rollback behavior
- choosing post-deploy verification checks
- tightening deployment evidence and operational safety

## Deployment loop

### 1. Define the release path

Capture:

- artifact produced
- environments crossed
- promotion trigger
- who is responsible when deploys fail

### 2. Keep config ownership separate

Deployment may inject or map config, but `../environment-setup/SKILL.md` still owns what config exists and how the app validates it.

### 3. Define rollout and rollback explicitly

Every meaningful deployment path should describe:

- rollout strategy
- health or readiness checks
- rollback trigger
- rollback mechanism

### 4. Prefer observable, repeatable automation

Good deployment automation is:

- repeatable
- environment-aware
- minimally manual for the critical path
- clear about what evidence proves success

### 5. Verify post-deploy safety

After deploy, confirm:

- expected version/artifact is live
- health checks pass
- critical paths are still working
- rollback remains available if regressions appear

## Deployment summary template

```markdown
## Deployment Path

### Release path
- artifact:
- environments:
- trigger:

### Rollout
- strategy:
- health checks:

### Rollback
- trigger:
- mechanism:

### Evidence
- what proves success:
```

## Boundary rules

- `deployment-automation` owns deploy/release flow.
- `environment-setup` owns runtime config meaning.
- `system-environment-setup` owns local/bootstrap tooling.
- `security-best-practices` owns infra-facing hardening posture.

## Common failures

- embedding config semantics in the deployment doc
- treating one platform/tool example as mandatory for every repo
- shipping without rollback criteria
- calling a manual checklist “automation” when the risky path is still ad hoc
- confusing deploy success with product-release approval

## Delivery checklist

- [ ] release path is explicit
- [ ] rollout and rollback are defined
- [ ] post-deploy verification exists
- [ ] config ownership stays delegated
- [ ] operational evidence is captured
