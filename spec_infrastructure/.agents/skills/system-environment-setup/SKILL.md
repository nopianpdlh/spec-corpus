---
name: system-environment-setup
description: Own host, workstation, container, and team bootstrap surfaces. Use when defining local prerequisites, dev containers, bootstrap scripts, and local infrastructure bring-up without taking over runtime config ownership.
metadata:
  tags: bootstrap, developer-environment, devcontainer, local-infra, workstation
  platforms: Claude, ChatGPT, Gemini, Codex
---

# System Environment Setup

`system-environment-setup` is the canonical infrastructure owner for host/system/team bootstrap.

It owns developer machine prerequisites, containerized local environments, bootstrap scripts, and local tooling conventions. It does **not** own the runtime config schema itself and must defer runtime variable meaning to `../environment-setup/SKILL.md`.

## Use this skill when

- defining workstation or container prerequisites
- documenting local developer onboarding steps
- standardizing dev containers, local services, or bootstrap scripts
- deciding how contributors reproduce shared local environments

## Bootstrap loop

### 1. Define the local execution surface

Capture:

- required local tools and versions
- local services or containers needed
- onboarding steps for a new contributor
- which steps are optional vs mandatory

### 2. Keep runtime config delegated

If bootstrap instructions require env vars, reference the runtime config owner instead of redefining the variables here.

This skill can say **how contributors obtain or inject config locally**, but not **what the runtime config contract means**.

### 3. Minimize bootstrap drift

Prefer:

- one obvious onboarding path
- repeatable local commands
- clear local vs production distinctions
- automation for common bootstrap pain points

### 4. Separate local convenience from deployment policy

Local Docker Compose, dev containers, Make targets, and helper scripts live here when they are about contributor bootstrap.

Deployment pipelines, promotion rules, and rollback policy do not.

### 5. Verify onboarding viability

Check whether a new contributor can answer:

- what to install
- how to start local dependencies
- how to obtain required config safely
- where to go when bootstrap fails

## Bootstrap template

```markdown
## Local Bootstrap

### Prerequisites
- tool name + minimum version

### Startup path
1. 
2. 
3. 

### Local services
- service
- how to start it

### Config handoff
- points to runtime config owner:
```

## Boundary rules

- `system-environment-setup` owns workstation/local bootstrap.
- `environment-setup` still owns runtime config shape and validation.
- `deployment-automation` owns deploy/release behavior.

## Common failures

- duplicating `.env` semantics instead of linking to the runtime config owner
- treating local Docker Compose as the production deployment spec
- forcing every contributor into one heavyweight bootstrap path without reason
- mixing onboarding docs with rollout policy

## Delivery checklist

- [ ] local prerequisites are explicit
- [ ] onboarding path is repeatable
- [ ] local services/bootstrap scripts are scoped clearly
- [ ] runtime config meaning is delegated to `environment-setup`
- [ ] local and production concerns are separated
