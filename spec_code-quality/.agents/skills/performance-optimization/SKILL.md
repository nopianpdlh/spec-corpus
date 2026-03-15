---
name: performance-optimization
description: Own measurement-driven performance work. Use when isolating bottlenecks, setting budgets, and applying optimizations without silently changing product or contract semantics.
metadata:
  tags: performance, optimization, profiling, budgets, regressions
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Performance Optimization

`performance-optimization` is the canonical quality owner for performance investigation and improvement.

It owns measurement, bottleneck isolation, optimization tradeoffs, and regression checks. It does **not** own product semantics, UX decisions, or external contract meaning.

## Use this skill when

- latency, throughput, memory, or cost is degrading
- a change touches a known hot path
- users report slowness but the bottleneck is not yet localized
- a team needs performance budgets or evidence before shipping

## Optimization loop

### 1. Measure before changing anything

Capture:

- the symptom users or operators observe
- the affected path or workload
- current baseline numbers
- the budget or target if one exists

Evidence may come from profiling, tracing, query plans, bundle analysis, benchmark runs, or production telemetry.

### 2. Localize the bottleneck

Classify the problem surface:

- render / client interaction
- network or payload size
- database / storage
- compute / algorithmic cost
- caching / repeated work
- startup / build / deployment overhead

If the problem is still ambiguous, use systematic debugging to narrow it first.

### 3. Choose the smallest high-signal fix

Typical strategies:

- remove redundant work
- reduce payload size or round trips
- fix poor query or indexing patterns
- cache deliberately with invalidation rules
- defer or lazy-load non-critical work
- improve concurrency limits or batching

### 4. Protect semantics while optimizing

Do not trade away:

- correctness
- security/privacy controls
- contract compatibility
- auditability or operational safety

If an optimization changes visible behavior, escalate to the relevant owner.

### 5. Re-measure and document tradeoffs

For every meaningful optimization, capture:

- before/after numbers
- what changed
- residual risk
- rollback trigger if the change regresses production behavior

## Performance summary template

```markdown
## Performance Investigation

### Symptom
- observed issue:
- affected path:

### Evidence
- baseline:
- bottleneck location:

### Change
- optimization applied:
- tradeoff accepted:

### Verification
- after metrics:
- regression checks:
- semantic-owner signoff needed?: yes/no
```

## Boundary rules

- `performance-optimization` owns the measurement and optimization method.
- frontend/backend/domain owners still own what the system should do.
- platform/security owners must approve changes that weaken safety boundaries.

## Common performance failures

- optimizing before measuring
- changing behavior and calling it “performance work”
- reporting a metric win without checking real user impact
- introducing caching without invalidation rules
- accepting complexity that is harder to maintain than the original bottleneck

## Delivery checklist

- [ ] baseline captured
- [ ] bottleneck localized
- [ ] smallest useful fix chosen
- [ ] semantics and policy impact checked
- [ ] before/after evidence recorded
