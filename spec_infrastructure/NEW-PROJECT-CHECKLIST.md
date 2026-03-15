# New Project Checklist

Use this checklist when adopting `spec_infrastructure` for a new project.

The goal is to make config, deployment, bootstrap, and hardening decisions explicit so infrastructure does not become an accidental mix of undocumented conventions.

## 1. Confirm Baseline Adoption

- [ ] project will use `spec_infrastructure` as the infrastructure baseline
- [ ] team has read `INFRA-SPEC-INDEX.md`
- [ ] team has read `DOMAIN-OWNERSHIP.md`
- [ ] owner set is acknowledged:
  - [ ] `environment-setup`
  - [ ] `deployment-automation`
  - [ ] `system-environment-setup` where local/bootstrap surfaces matter
  - [ ] `security-best-practices` where runtime/deploy hardening matters

## 2. Lock the Runtime Configuration Model

- [ ] runtime env/config values are identified
- [ ] required vs optional config is defined
- [ ] secret boundaries and storage rules are identified
- [ ] config validation/loading approach is defined
- [ ] per-environment overrides are defined deliberately

## 3. Lock the Deployment Model

- [ ] build artifact and promotion path is defined
- [ ] deploy trigger and rollout strategy are defined
- [ ] rollback strategy is defined
- [ ] post-deploy verification / health checks are defined
- [ ] ownership for deployment failures is defined

## 4. Lock the Bootstrap Model

- [ ] local machine / container prerequisites are documented
- [ ] local tooling/bootstrap scripts are identified
- [ ] team onboarding path is documented
- [ ] local infra needs are documented separately from production config ownership

## 5. Lock the Hardening Model

- [ ] least-privilege expectations are defined
- [ ] secret rotation/storage expectations are identified
- [ ] network exposure defaults are identified
- [ ] dependency/patch/update hygiene expectations are documented
- [ ] external security/privacy policy owners are identified

## 6. Define External Owners

- [ ] backend/frontend/domain owners are identified
- [ ] security/privacy owner is identified
- [ ] product/release authority is identified
- [ ] QA / release-governance owner is identified if needed

For each external dependency, record:

- owning repo/doc
- what infrastructure decisions depend on it
- who resolves conflicts
- what evidence must be preserved

## Minimal Adoption Rule

If the project cannot explain:

- who owns runtime configuration,
- who owns deployment automation,
- who owns host/bootstrap setup,
- who owns infra-facing hardening guidance,
- and which external repo owns semantics and policy,

then `spec_infrastructure` has not actually been adopted yet.
