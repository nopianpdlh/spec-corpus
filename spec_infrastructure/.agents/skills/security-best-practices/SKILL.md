---
name: security-best-practices
description: Own infrastructure-facing hardening guidance. Use when setting defaults for secret handling, least privilege, surface reduction, patching posture, and deploy/runtime hardening without redefining application auth semantics or org-wide policy.
metadata:
  tags: security, hardening, least-privilege, secrets, exposure
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Security Best Practices

`security-best-practices` is the canonical infrastructure owner for infra-facing hardening guidance.

It owns secret-handling hygiene, least-privilege defaults, runtime/deployment surface reduction, and patch/update posture. It does **not** own organization-wide security/privacy policy or application auth semantics visible to clients.

## Use this skill when

- hardening deployment or runtime surfaces
- reviewing secret storage and exposure defaults
- tightening network/service privilege boundaries
- defining patch/update expectations for infra-facing components
- checking whether infrastructure defaults are safer by default

## Hardening loop

### 1. Identify the exposed surface

Capture:

- public entry points
- privileged internal paths
- secret stores and injection points
- dependencies or services that expand attack surface

### 2. Apply least privilege and surface reduction

Prefer:

- smallest required permissions
- minimal public exposure
- short-lived credentials where feasible
- disabled-by-default optional exposure

### 3. Protect secret handling

Make it obvious:

- where secrets are stored
- how they are injected
- who can read them
- how rotation/revocation is handled operationally

### 4. Separate hardening from app semantics

This skill can require safer runtime/deploy posture, but it does not decide:

- API-visible auth responses
- product privacy promises
- org compliance policy wording

### 5. Verify hardening guidance is actionable

For meaningful changes, confirm:

- default exposure is intentional
- secret boundaries are still safe
- privilege levels are justified
- update/patch expectations are documented
- external policy owners are referenced where needed

## Hardening review template

```markdown
## Hardening Review

### Surface
- exposed components:
- privileged paths:

### Controls
- secret handling:
- least privilege:
- exposure defaults:
- update/patch posture:

### External owners
- policy/auth owner references:
```

## Boundary rules

- If the question is **how infra/runtime/deploy surfaces are hardened**, `security-best-practices` owns it.
- If the question is **what runtime config exists**, defer to `../environment-setup/SKILL.md`.
- If the question is **how auth behaves for clients or services semantically**, defer to the backend/security-policy owner.

## Common failures

- rewriting auth semantics inside an infra hardening doc
- documenting app middleware specifics as if they were universal infra policy
- treating “use HTTPS” as sufficient security guidance without privilege/secret boundaries
- hiding secret rotation assumptions inside deployment scripts only

## Delivery checklist

- [ ] exposed surfaces identified
- [ ] least-privilege expectations stated
- [ ] secret handling boundaries are clear
- [ ] patch/update posture is documented
- [ ] semantic/policy concerns are escalated to the real owners
