# UCD source syntax

UCD Studio uses a small, line-oriented language for UML use case diagrams. The syntax is intended to remain readable in requirements documents and Git diffs.

## Document structure

Blank lines are ignored. A line beginning with `//` is a comment. Names containing spaces or syntax characters should be wrapped in double quotes.

### Title

An optional level-one Markdown heading names the document:

```text
# Product Discovery Workspace
```

Only one title is allowed.

### Actors

Declare actors in an `actors` block:

```text
actors:
  - Product Manager
  - Designer
  - "Research Repository"
```

Actors are people, roles, organisations, or external systems that interact with the system being modelled.

### System boundaries and use cases

A `system` block declares a labelled boundary and the use cases it contains:

```text
system "Discovery Workspace":
  - Capture Opportunity
  - Review Evidence
  - Prioritise Opportunity
```

Multiple system blocks are allowed. A use case belongs to at most one system boundary.

Use cases that sit outside a system boundary can be declared in a `use cases` block:

```text
use cases:
  - Authenticate User
```

### Associations

An actor block lists the use cases associated with that actor:

```text
Product Manager:
  -> Capture Opportunity
  -> "Prioritise Opportunity"
```

The equivalent single-line form is also valid:

```text
Designer -> "Review Evidence"
```

### Include and extend

Use a dashed dependency arrow and a relationship label. The relationship label is case-insensitive.

```text
"Prioritise Opportunity" ..> "Review Evidence" : include
"Share Roadmap" ..> "Authenticate User" : include
"Attach Research Note" ..> "Capture Opportunity" : extend
```

For `include`, the source use case includes the target. For `extend`, the source use case extends the target.

### Generalisation

Use `--|>` with the specialised actor or use case on the left and its general parent on the right:

```text
Administrator --|> Team Member
"Bulk Import Opportunities" --|> "Import Opportunities"
```

Both ends must resolve to the same kind of element.

### Optional layout hints

Automatic layout is the default. A `layout` block can provide a preferred direction and fixed positions for selected elements:

```text
layout:
  direction: left-to-right
  "Product Manager": 40, 120
  "Capture Opportunity": 320, 120
```

Supported directions are `left-to-right`, `right-to-left`, `top-to-bottom`, and `bottom-to-top`. Coordinates are SVG user-space values. Layout hints are advisory so a future layout engine can interpret or ignore them without changing the parser or renderer.

## Complete example

```text
# Product Discovery Workspace

actors:
  - Product Manager
  - Designer
  - Stakeholder

system "Discovery Workspace":
  - Capture Opportunity
  - Review Evidence
  - Prioritise Opportunity
  - Share Roadmap

Product Manager:
  -> Capture Opportunity
  -> Prioritise Opportunity

Designer:
  -> Capture Opportunity
  -> Review Evidence

Stakeholder:
  -> Share Roadmap

"Prioritise Opportunity" ..> "Review Evidence" : include
```

## Language rules

- Names are matched case-sensitively after surrounding whitespace is removed.
- Duplicate actor, use case, and system names are invalid.
- References must resolve to declared elements.
- Associations must connect an actor and a use case.
- Include and extend relationships must connect two use cases.
- Generalisation must connect two actors or two use cases.
- Parser errors report one-based line and column positions.
