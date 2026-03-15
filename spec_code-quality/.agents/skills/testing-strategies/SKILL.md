---
name: testing-strategies
description: Own verification strategy and release confidence. Use when deciding which test layers matter, how to keep tests deterministic, and what evidence proves a change is safe enough to ship.
metadata:
  tags: testing, verification, quality-gates, contract-testing, determinism
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Testing Strategies

`testing-strategies` is the canonical quality owner for verification design.

It owns test-layer choice, deterministic setup, failure-path coverage, contract verification, and release evidence expectations. It does **not** own the product or API semantics being tested, and it does **not** force one framework stack on every repo.

## Use this skill when

- defining a new project’s test portfolio
- deciding what evidence is required for a risky change
- fixing flaky or low-signal test suites
- choosing between unit, integration, contract, end-to-end, or non-test verification
- clarifying what “enough confidence” means before release

## Verification design loop

### 1. Identify the change risk

Capture:

- what behavior could regress
- who consumes that behavior
- whether state, concurrency, permissions, or compatibility are involved
- whether a failure would be local, cross-service, or user-visible

### 2. Choose the smallest sufficient test portfolio

Typical layers:

- **unit** — isolated logic or transformation rules
- **service/module** — behavior across a small local boundary
- **integration** — real persistence, queue, network, or framework integration
- **contract** — proves implementation still matches an externally owned contract
- **end-to-end / scenario** — proves critical user or operator flows across boundaries

Use the smallest combination that closes the actual risk.

### 3. Protect determinism

Prefer:

- explicit fixtures and factory data
- event- or state-based waiting instead of sleeps
- stable external dependencies or realistic fakes
- cleanup that leaves tests independent

Avoid coupling tests to timing luck, shared mutable state, or unrelated implementation details.

### 4. Cover failure paths, not only success paths

For meaningful changes, decide which of these must be exercised:

- invalid input
- permission/auth failure
- dependency failure
- empty-state / not-found behavior
- rollback or retry behavior
- compatibility or migration edges

### 5. Define release evidence

Possible evidence sources:

- targeted tests
- contract checks
- profiling or benchmarks
- migration dry runs
- lint/type/static validation
- manual scenario verification when automation is not credible yet

## Test strategy template

```markdown
## Verification Plan

### Risk surface
- behavior at risk:
- affected consumers:

### Chosen evidence
- unit:
- integration:
- contract:
- scenario / e2e:
- non-test checks:

### Determinism rules
- fixtures:
- waiting strategy:
- cleanup / isolation:

### Release gate
- what must pass before ship:
```

## Boundary rules

- `testing-strategies` decides **how confidence is built**, not what the feature should mean.
- Contract semantics remain owned by frontend/backend/domain repos.
- Framework choice is a project decision unless a repo-specific constraint already exists.

## Common testing failures

- copying a generic test pyramid ratio without matching real risk
- snapshotting unstable outputs instead of asserting intended behavior
- relying on sleeps or race-prone waits
- overusing end-to-end tests for logic that should be proven earlier
- claiming coverage is sufficient without naming the uncovered failure modes

## Delivery checklist

- [ ] risk surface identified
- [ ] smallest sufficient layers chosen
- [ ] deterministic setup defined
- [ ] critical failure paths covered
- [ ] release evidence expectations made explicit
