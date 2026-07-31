# Contributing

Canvas behavior is requirement-driven. Before changing a feature, update the
requirements chain in this order: FSD → SKPL → PRD. Implementation and behavior
tests should reference the latest PRD contract.

Before submitting a change, run:

```bash
npm run test:canvas
npm run lint
npx tsc --noEmit
npm run build
```

New canvas mutations should preserve lock/visibility eligibility rules, record
an undoable history state, and receive a smoke-test scenario.
