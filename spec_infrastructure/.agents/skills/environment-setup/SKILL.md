---
name: environment-setup
description: Own application and runtime configuration. Use when defining env/config contracts, validation, secret boundaries, and per-environment runtime behavior.
allowed-tools: Read Write Edit Bash
metadata:
  tags: environment, runtime-config, env-variables, validation, secrets
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Environment Setup

`environment-setup` is the canonical infrastructure owner for application/runtime configuration.

It owns the shape of runtime config, required vs optional values, validation/loading rules, secret boundaries, and per-environment overrides. It does **not** own workstation bootstrap, deployment orchestration, or backend auth semantics.

## Use this skill when

- defining `.env` / runtime config contracts
- deciding which settings are required in each environment
- validating environment values at startup
- separating secrets from non-secret config
- documenting how the app reads configuration

## Runtime configuration loop

### 1. Define the config contract

Capture:

- required variables
- optional variables and defaults
- secret vs non-secret boundaries
- per-environment differences that are intentional

### 2. Validate at load time

The application should fail clearly when required runtime config is missing or malformed.

Prefer:

- a single config entrypoint
- schema validation or equivalent guardrails
- typed access where the stack supports it

### 3. Separate storage from meaning

Make it obvious:

- where values come from
- which values must never be committed
- which values may differ across local/staging/production
- which values are consumed by runtime code vs only deployment tooling

### 4. Keep runtime ownership narrow

`environment-setup` owns **what config exists and how the app consumes it**.

It does not own:

- developer machine prerequisites
- dev containers or workstation tooling
- CI/CD rollout steps
- org-wide security policy

### 5. Verify the runtime model

For any meaningful config change, confirm:

- required values are documented
- validation is updated
- defaults are intentional
- secret handling remains safe
- deployment/bootstrap docs point at the same config contract instead of redefining it

## Runtime config template

```markdown
## Runtime Configuration

### Required values
- NAME: purpose, secret?, source

### Optional values
- NAME: default, effect

### Validation
- startup validation path:
- failure behavior:

### Per-environment notes
- local:
- staging:
- production:
```

## Boundary rules

- If the question is **what env vars/config values exist and how the app reads them**, `environment-setup` owns it.
- If the question is **how contributors bootstrap local machines or containers**, use `../system-environment-setup/SKILL.md`.
- If the question is **how artifacts are deployed or rolled back**, use `../deployment-automation/SKILL.md`.
- If the question is **how infra surfaces are hardened**, use `../security-best-practices/SKILL.md`.

## Common failures

- mixing developer bootstrap instructions into runtime config ownership
- storing semantic defaults in random modules instead of one config contract
- using deployment tooling docs as the source of runtime truth
- silently treating secrets as ordinary config
- adding environment flags without documenting who owns them or why they exist

## Delivery checklist

- [ ] runtime config contract is explicit
- [ ] required vs optional values are clear
- [ ] validation path exists
- [ ] secret boundaries are named
- [ ] bootstrap/deploy docs defer to this runtime contract
