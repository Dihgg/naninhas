# Naninha Sleep Buff Plan

## Goal

Add a new naninha-specific sleep feature that grants a temporary buff after waking up when one or more naninhas are present on the sleeping surface or relevant sleep context.

Required behavior:

- If a naninha is present while sleeping, grant its buff after waking.
- If multiple naninhas are present, pick one buff at random.
- Temporary sleep buff and attached naninha buff can coexist.
- If the selected temporary plushie is already attached, ignore it for temporary application.
- Sleep buff duration is based on bed quality:
	- bad quality bed: 3 in-game hours,
	- average quality bed: 6 in-game hours,
	- good quality bed: 8 in-game hours.

This plan assumes we keep the current attached-plushie system intact and add a second, separate activation path for sleep-derived buffs.

## Recommended Design

Use a new client-side sleep placement detector plus a server-authoritative temporary buff state.

Why this direction:

- Vanilla pillow logic is local and bed-context based, but naninhas need different buffs than pillow comfort.
- The current mod already has a clean server-authoritative reconcile pipeline for plushie effects.
- Reusing the existing authority model avoids client/server drift, duplicate trait restores, and multiplayer desync.

## High-Level Flow

1. Client detects sleep start and tracks whether the player is currently asleep.
2. While the player is asleep, client evaluates the nearby bed or sleep context for naninhas.
3. On wake, client sends candidates plus detected bed quality to the server.
4. Server validates the request, removes candidates already attached, randomly chooses one remaining candidate, resolves duration from bed quality, then applies a temporary buff authoritatively.
5. Client keeps ticking while awake.
6. When the quality-derived duration expires (3/6/8h), the server removes the temporary buff.
7. Attached plushie buffs continue to run in parallel with temporary sleep buffs.

## Key Design Choice

Treat sleep buffs as a separate state layer from attached plushie buffs.

Do not fold sleep buffs directly into `activePlushieNames`.

Reason:

- Attached plushies are inventory-driven and stable while equipped.
- Sleep buffs are time-limited, random, and triggered by world placement.
- Mixing both into one list would make expiration and removal rules harder to reason about.

Instead, keep two parallel domains:

- Attached plushie state: existing behavior.
- Source-scoped temporary buff state: new behavior (sleep is the first source).

## Proposed New Concepts

### 1. Sleep Context Detector

New client component, for example `SleepBuffDetector`.

Responsibilities:

- Track asleep state transitions using `player:isAsleep()`.
- On sleep start, capture enough context to inspect the correct bed or sleep surface.
- While asleep, collect candidate naninhas from the relevant squares or containers.
- On wake, send deduplicated candidates and resolved bed type to the server for authoritative selection.

Recommended implementation detail:

- Use transition polling from the existing `everyOneMinute` loop first.
- Keep a local `wasAsleep` boolean.
- On `false -> true`, call `onSleepStarted()`.
- On `true -> false`, call `onWokeUp()`.

Why polling first:

- It fits the current mod structure.
- PipeWrench in this repo already exposes the events used by the mod today.
- It avoids an early dependency on raw unwrapped game events.

Possible later enhancement:

- If raw sleeping events are easy to type safely, switch the detector to `OnSleepingTick` or a more specific wake event.

### 2. Sleep Context Snapshot

New small data structure, for example:

```ts
type SleepContext = {
	mode: "bed" | "floor" | "vehicle" | "tent";
	bedSquareX?: number;
	bedSquareY?: number;
	bedSquareZ?: number;
	gridSquares?: Array<{ x: number; y: number; z: number }>;
	startedAtHour: number;
};
```

Purpose:

- Decouple detection from live `IsoObject` references when possible.
- Avoid relying on object identity across long sleep stretches.
- Make the detector easier to test with plain data.

Recommended capture strategy:

- If sleeping in a bed, capture all sprite-grid squares for that bed, similar to vanilla pillow lookup.
- If sleeping on the floor, capture the current player square.
- If sleeping in a vehicle, skip sleep-buff candidate collection (no vehicle support in v1).
- If sleeping in a tent, inspect the tent container and/or tent squares as a dedicated case.

## How to Detect a Naninha on the Bed

Mirror the vanilla pillow detection shape, but match known naninha items instead of `ItemTag.PILLOW`.

Detection order:

1. Resolve the relevant sleep context.
2. Gather plushie candidates from containers supported by the sleep context (bed container and tent container when present).
3. Gather all world inventory objects on the relevant square set.
4. Extract item names from both container items and world items.
5. Filter to names known by `PlushieCatalog`.
6. Deduplicate by plushie name.

Important constraint:

- Match vanilla pillow-style placement coverage: supported containers plus world items on relevant squares.

This keeps behavior intuitive for players already familiar with vanilla pillow logic.

Out of scope for v1:

- vehicle-seat container support.

## Random Selection Rule

On wake, if the candidate set contains more than one naninha:

- send the deduplicated candidate list to the server.

Recommendation:

- Perform the random pick on the server, not the client, if we want stricter authority.
- The client should send the deduplicated candidate list.
- The server should exclude already-attached plushie names before random roll.

This is preferable because:

- multiplayer authority stays server-side,
- replaying test cases is easier,
- future anti-cheat validation is simpler.

## New Network Flow

Add a second command pair for sleep buffs, separate from `SYNC_PLUSHIE`.

Example:

```ts
Commands.SYNC_SLEEP_BUFF = {
	REQUEST: "SyncSleepBuff.Request",
	RESPONSE: "SyncSleepBuff.Response"
};
```

Suggested request payload:

```ts
type RequestSleepBuffPayload = {
	candidateNames: string[];
	bedType: "badBed" | "averageBed" | "goodBed" | "floor";
};
```

Rationale:

- `sleptAtHour` is not required because the buff is decided and applied at wake time.
- `wokeAtHour` is also not required for gameplay logic because server expiration is computed from current `worldAgeHours` plus duration.
- `context` is not required for gameplay logic because duration and application decisions are driven by candidate set + resolved `bedType`.
- If timing telemetry is wanted later, add an optional debug-only timestamp field without coupling it to gameplay behavior.
- If context telemetry is wanted later, add an optional debug-only context field without coupling it to gameplay behavior.

Suggested response payload:

```ts
type ApplySleepBuffPayload = {
	appliedName?: string;
	rejectedNames: string[];
	resolvedBedType?: "badBed" | "averageBed" | "goodBed" | "floor";
	durationHours?: number;
	expiresAtWorldAgeHours?: number;
};
```

## Bed Quality Duration Mapping

Use vanilla bed quality classification as the source of duration.

Mapping:

- `badBed` => 3h
- `averageBed` => 6h
- `goodBed` => 8h

Suggested fallback:

- `floor` => 3h

Implementation note:

- Reuse the same bed-quality detection shape as vanilla sleep context where possible, but keep final duration resolution server-side.

## Server-Side State Model

Extend the authoritative mod data with a generic temporary buff block.

Suggested shape:

```ts
type TemporaryBuffSource = "sleep";

type TemporaryBuffState = {
	activeName?: string;
	expiresAtWorldAgeHours?: number;
	source: TemporaryBuffSource | null;
};
```

Then extend the main authoritative shape:

```ts
type NaninhasAuthoritativeState = {
	activePlushieNames: string[];
	addedTraits: string[];
	suppressedTraits: string[];
	xpBoosts: Record<string, number>;
	temporaryBuff: TemporaryBuffState;
};
```

This will require a schema bump and migration default.

## How the Server Should Apply the Temporary Buff

Recommended rule:

- A temporary sleep buff uses the same effect definition as its corresponding plushie.
- It is applied exactly like one virtual active plushie, but under a separate state bucket.
- Temporary sleep buff does not cancel or replace attached plushie buffs; both sources can be active together.

Implementation approach:

1. Keep the existing attached-plushie reconcile logic intact.
2. Add a second reconcile path for the temporary sleep buff.
3. Aggregate both layers before applying traits and XP deltas.

### Chosen Approach: Option B (Two Source-Aware State Buckets)

Track effects from attached and temporary sources separately, then merge them before diffing.

Pros:

- cleaner reasoning,
- easier expiration handling,
- easier future extensions.

Cons:

- slightly more code.

Decision:

- Option B is the implementation baseline for this feature.
- A single-source merge model is intentionally avoided to prevent mixed-source lifecycle complexity.

Why this is locked:

- expiration belongs only to temporary sleep source,
- attached source must remain stable and independently synced,
- merge-at-apply keeps trait and XP calculations deterministic.

## Expiration Model

Store the expiration using world age hours, not wall-clock or local time-of-day.

Recommended value:

- `expiresAtWorldAgeHours = GameTime.getInstance():getWorldAgeHours() + durationHours`

Why:

- it is monotonic,
- it avoids crossing-midnight edge cases,
- it is easier to compare on both client and server.

Expiration check points:

- whenever the server handles any naninhas-related command,
- optionally from a periodic server tick if needed later,
- when the client next syncs attached plushies after waking.

For the first implementation, lazy expiration on the next relevant command may be enough, but a dedicated periodic cleanup is safer if the buff must end exactly on time.

Recommendation:

- add a small server-side periodic cleanup path if PipeWrench exposes a suitable minute tick on the server,
- otherwise document that expiration is enforced on the next naninhas interaction and revisit if needed.

## Coexistence Rule With Equipped Naninhas

This rule should be enforced on the server.

Behavior:

- if `temporaryBuff.activeName` exists and attached plushies are also active, keep both active,
- reconcile the final effect set as the union of both sources,
- only remove the temporary sleep buff on expiration (or explicit future cancel rules).
- when selecting a new temporary sleep buff, skip candidates already present in the attached source.

Important nuance:

- when temporary and attached sources overlap on the same trait or XP boost, apply idempotent set/merge logic so effects are not double-applied.

## Recommended File-Level Changes

### Client

- `src/client/components/Naninhas.ts`
  - instantiate and tick the new sleep detector beside the existing attached-plushie sync flow.

- `src/client/components/SleepBuffDetector.ts`
  - new detector for asleep transitions and candidate scanning.

- `src/client/components/SleepBuffRequestPublisher.ts`
  - optional separate publisher if we want to keep networking concerns out of the detector.

### Shared

- `src/shared/catalog/PlushieCatalog.ts`
  - no schema change required if sleep buffs reuse existing plushie definitions.

- `src/shared/components/PlayerApi.ts`
  - add helpers for sleep-state reads, bed square discovery, world-item scanning, and maybe world age hours.

- `src/types.d.ts`
  - add request/response payloads and temporary sleep buff state.

- `src/shared/components/PlushieReconciler.ts`
  - either extend or complement with a source-aware reconcile strategy.

### Server

- `src/server/components/NaninhasCommandHandler.ts`
  - expire temporary buffs when needed,
	- keep temporary and attached sources active concurrently,
  - merge source states before applying live changes.

- `src/server/components/SleepBuffCommandHandler.ts`
  - new handler for wake-up requests,
  - validate names,
	- randomly choose one buff,
	- resolve duration from bed quality,
	- apply temporary state.

- `src/server/Naninhas.ts`
  - register the new command handler.

## Suggested Implementation Order

### Phase 1: Types and State

- Add temporary sleep buff types.
- Add new request/response payloads.
- Bump protocol schema version if authoritative state changes.
- Add migration default for existing saves.

### Phase 2: Client Detection

- Implement asleep transition tracking.
- Capture sleep context at sleep start.
- Scan supported containers and world items on relevant squares.
- Send candidate list on wake.

## Implementation Readiness Rules

Lock these behavior rules before coding so handlers and tests stay deterministic:

1. Empty post-filter candidate set:
If all wake-time candidates are filtered out (unknown names or already-attached names), do not apply a new temporary buff.

2. Existing temporary buff when waking again:
If a new valid temporary plushie is selected on wake, replace the previous temporary sleep buff and reset expiration from the new wake event.

3. Existing temporary buff when wake yields no valid candidate:
Leave the existing temporary sleep buff unchanged; it continues until its current expiration.

4. Bed type trust boundary:
Server accepts only `badBed`, `averageBed`, `goodBed`, or `floor`; unknown values must fall back to `averageBed` before duration mapping.

5. Authoritative RNG location:
Random selection occurs on the server only.

### Phase 3: Server Application

- Add sleep buff request handler.
- Validate candidate names.
- Randomly choose one name.
- Persist expiration timestamp.
- Apply temporary effects authoritatively.

### Phase 4: Interaction With Equipped Plushies

- Update attached sync path to preserve temporary sleep buffs while attached plushies are active.
- Ensure reconcile output remains stable when temporary and attached sources overlap in traits or XP boosts.

### Phase 5: Expiration

- Add expiration checks.
- Remove expired temporary effects cleanly.
- Ensure saved state reloads correctly after relog or reconnect.

### Phase 6: UX and Tooltips

- Optional tooltip or feedback on wake.
- Optional debug logging for chosen sleep buff and expiration.

## Testing Plan

Add focused Jest coverage before wiring the whole feature end-to-end.

### Unit Tests

- detector returns no candidates when neither relevant containers nor world squares contain naninhas,
- detector deduplicates duplicate world items of the same plushie,
- detector deduplicates when the same plushie appears in both container and world item sources,
- detector finds plushies across all bed sprite-grid squares,
- detector finds plushies in supported bed/tent containers,
- wake flow sends candidates only after an asleep-to-awake transition,
- sleep buff handler rejects unknown names,
- sleep buff handler picks one name from multiple candidates,
- sleep buff handler ignores candidates already attached,
- sleep buff handler maps bed quality to duration 3h/6h/8h,
- temporary sleep buff expires according to resolved duration,
- attached plushie and temporary sleep buff coexist without forced removal,
- overlapping trait/xp definitions do not double-apply or double-remove.

### Integration-Oriented Tests

- attached plushie sync remains unchanged when no temporary buff is active,
- temporary buff survives wake and applies until quality-based expiration,
- temporary and attached buffs remain active together,
- reconnect or save-load restores temporary state and still expires correctly.

## Edge Cases Decisions

Locked decisions for v1:

1. Vehicle sleep support:
No vehicle sleep support in v1.

2. Container support parity with vanilla pillow behavior:
If the sleep context supports container-based detection (for example bed/tent container), naninhas must support that container path as well.

3. Evaluation timing:
Evaluate candidate naninhas at wake time.

4. Duplicate handling and random roll:
Deduplicate candidate names first, then perform random roll across unique names.

5. Attached overlap guard:
If a candidate plushie is already attached, it must be ignored for temporary sleep-buff selection.

## Lowest-Risk v1 Scope

If we want the smallest safe rollout, implement only this:

- single-player and multiplayer,
- normal beds and floor sleep,
- container + world-item naninha detection for supported sleep contexts,
- one temporary buff at a time,
- random selection from unique candidate names,
- quality-based duration mapping (3h/6h/8h),
- coexistence with attached plushies.

This keeps the feature aligned with the current architecture while matching expected vanilla-style placement behavior.

## Suggested First Build Slice

The smallest useful slice to implement first is:

1. client sleep transition detector,
2. naninha scan from supported containers and world items on relevant squares,
3. new sleep buff request command,
4. server-authoritative one-name temporary buff with bed-quality duration,
5. coexistence with attached plushie buffs.

That slice is narrow, testable, and enough to prove the feature end-to-end.