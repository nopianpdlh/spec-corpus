# Domain Ownership and Precedence

This file defines which document owns which documentation domain and how to resolve overlap.

## Precedence Rules

1. **The canonical documentation owner wins inside its domain.**
2. **Documentation owners package and explain truth; they do not invent product, API, or platform semantics.**
3. **Supporting companions help specific outputs or workflows, but they do not become umbrella owners by implication.**
4. **External spec repositories keep ownership of the domains being documented.**
5. **Repeated ambiguity must be written back into this file and the relevant skill.**

## Documentation-Owned Domains

| Domain | Canonical owner | Includes | Explicitly does not own |
|---|---|---|---|
| Documentation authoring and structure | `.agents/skills/technical-writing/SKILL.md` | document purpose, audience, structure, terminology, maintenance expectations, navigation, review criteria | product requirements, API truth, backend/frontend/platform policy |
| Release communication and change history | `.agents/skills/changelog-maintenance/SKILL.md` | changelog format, release notes, deprecation visibility, migration guidance, change classification for readers | redefining the underlying change, approving releases, product roadmap decisions |

## Supporting Companion Scope

| Companion | Use for | Not a replacement for |
|---|---|---|
| `.agents/skills/presentation-builder/SKILL.md` | turning agreed content into slide/presentation artifacts | documentation standards or release-note ownership |
| `.agents/skills/using-git-worktrees/SKILL.md` | isolated doc work, branch hygiene, safer editing workflows | documentation policy, content quality ownership |

## Practical Boundary Rules

- If the question is **how a document should be written, structured, or maintained**, `technical-writing` owns it.
- If the question is **how shipped changes are communicated over time**, `changelog-maintenance` owns it.
- If the question is **how to package material for a presentation**, `presentation-builder` is the companion.
- If the question is **how contributors isolate doc changes safely in git**, `using-git-worktrees` is the workflow utility.

## Cross-Owner Examples

- **A changelog entry claims a feature behaves differently from the API spec** → `changelog-maintenance` owns the communication format, but the backend/frontend/domain owner still owns the behavior being described.
- **A presentation deck uses friendlier wording than the canonical docs** → `presentation-builder` owns packaging, but `technical-writing` still owns documentation quality standards.
- **A worktree workflow is suggested as documentation policy** → `using-git-worktrees` is process-only; it does not become the documentation owner.

## External Domain Ownership

| External domain | Owned outside `spec_documentation` | Documentation responsibility |
|---|---|---|
| Product / requirements | PRD/domain spec | document the agreed decisions clearly and accurately |
| Frontend / backend / platform behavior | their respective spec repos | describe those systems without redefining them |
| Security / privacy policy | security/privacy spec | communicate the policy implications accurately without claiming ownership |

## Conflict Resolution Workflow

1. identify whether the dispute is about content quality, release communication, or the underlying system meaning
2. apply the documentation owner only to content/communication concerns
3. defer semantic truth to the external domain owner
4. update this file if the same boundary keeps causing confusion
