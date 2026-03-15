---
name: database-schema-design
description: Use when designing or reviewing backend storage models, relationships, indexes, constraints, and migration safety while keeping internal schema truth distinct from the external API contract.
metadata:
  tags: database, schema, sql, nosql, migration, indexing, persistence
  platforms: Claude, ChatGPT, Gemini
---

# Database Schema Design

This skill owns internal storage modeling for backend systems. It explains how to model entities, relationships, indexes, constraints, and migrations without treating the database schema as the public API.

## When to Use

- designing a new relational or document-backed storage model
- reviewing entity relationships and indexing strategy
- planning schema changes and migrations
- checking whether internal schema decisions are leaking into the external contract
- evaluating trade-offs between normalization, denormalization, and operational safety

## Ownership Boundaries

- `database-schema-design` owns internal storage truth.
- it owns tables/collections, relationships, indexes, constraints, migration sequencing, and schema safety.
- it owns how backend persistence supports service behavior.
- it does **not** own the consumer-facing API contract; `design-api` owns external resource names, public field naming, and contract semantics.
- it does **not** own authentication/session policy.
- it does **not** own infrastructure runtime policy outside storage-facing implications.

## Core Modeling Rule

Model storage for correctness, clarity, and operational safety first. Then make the mapping to public resources explicit rather than assuming the database row shape should leak directly into the API.

## Internal Model vs External Contract

It is normal for the storage model and public API model to differ.

Example:

- database columns may use `snake_case`
- public JSON may use `camelCase`
- junction tables, audit columns, and denormalized helpers may exist internally but never appear in the external contract

If a public field exists only because a table happened to look that way, the storage model is incorrectly driving the contract.

## Storage Design Pattern

### 1. Start from domain entities and access patterns

Define:

- core entities
- key relationships
- write paths
- critical read paths
- retention or archival constraints

### 2. Choose naming and key strategy deliberately

For relational stores, pick one consistent naming convention for schema objects and document it.

Example relational pattern:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3. Make relationships explicit

- 1:1 → foreign key plus uniqueness when appropriate
- 1:N → foreign key with indexing strategy
- N:M → junction table or explicit linking collection

### 4. Design indexes around real access patterns

Index for the queries that matter, not for every column that exists.

### 5. Treat migrations as product-risk events

Schema changes should be designed for rollout safety.

At minimum, ask:

- is this additive or destructive?
- does it require backfill?
- can old and new code run during rollout?
- does rollback exist if deployment stalls?

## Migration Safety Rules

- prefer additive migrations before destructive removals
- do not drop or rename heavily used columns in the same step that consumers still depend on them indirectly
- sequence data backfills and application rollouts deliberately
- verify indexes and constraints introduced by the migration against the expected traffic path

## API Resource Mapping Checklist

Before approving a schema decision, ask:

1. Which public resource or behavior does this support?
2. Is the storage model leaking internal names or helper tables into the API?
3. Does `design-api` require a different external naming or payload shape?
4. Will this migration force consumer-visible behavior changes?
5. If yes, has the API contract been updated deliberately rather than accidentally?

## Practical Review Questions

1. Are the entities and relationships clear?
2. Are indexes tied to real read/write paths?
3. Are constraints explicit enough to protect data integrity?
4. Are timestamps, retention, soft-delete, or audit needs handled deliberately?
5. Is migration sequencing safe for production rollout?
6. Is the boundary between internal storage and external contract still clear?

## Quick Reference

| Topic | Rule |
|---|---|
| Ownership | internal storage only; external contract stays with `design-api` |
| Naming | storage naming can differ from public API naming |
| Indexes | tie to real access paths |
| Constraints | make integrity explicit |
| Migrations | prefer additive and rollout-safe sequencing |
| API mapping | make translation deliberate, never accidental |

## Common Mistakes

- treating table shape as the public API shape
- letting ORM defaults become the domain model without review
- adding indexes everywhere without considering write cost
- performing destructive migrations before the rest of the system is ready
- mixing storage naming rules with public JSON naming rules as if they must match exactly
- forgetting to model how the schema supports the consumer-facing contract

## Delivery Checklist

- entities and relationships documented
- key access paths considered in indexing strategy
- constraints and defaults documented
- migration safety considered for schema changes
- storage-to-API mapping made explicit
- contract ownership left with `design-api`
