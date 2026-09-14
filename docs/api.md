# API for other mods

[Documentation index](README.md) · [Project README](../README.md)

Naninhas emits three **client-side** plushie events from its attachment observer. They are useful for UI, audio, and other local reactions. They report configured effects, not an authoritative confirmation that traits or XP boosts have been applied. The server owns buff application; do not change player traits based solely on these notifications.

| Event                | When emitted                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `NaninhasEquipped`   | A recognized plushie first appears in the client's attached set. |
| `NaninhasUnequipped` | A recognized plushie leaves that set.                            |
| `NaninhasUpdate`     | Once per in-game minute for each currently observed plushie.     |

Each event receives one table:

| Field              | Type                     | Meaning                                                                                                 |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `name`             | string                   | Internal plushie name, such as `BorisBadger`.                                                           |
| `addedTraits`      | string array             | Traits the plushie is configured to grant.                                                              |
| `suppressedTraits` | string array             | Traits the plushie is configured to suppress.                                                           |
| `xpBoosts`         | table of string → number | Configured XP boost values. Keys are assembled from the plushie name and perk, so treat them as opaque. |

The corresponding source type is [`EventData`](../src/types.d.ts). Event names live in [`EventsEnum`](../src/shared/constants.ts).

```lua
-- Run this in client Lua after Naninhas has registered its custom events.
Events.NaninhasEquipped.Add(function(data)
    print("Equipped plushie: " .. data.name)
end)

Events.NaninhasUnequipped.Add(function(data)
    print("Unequipped plushie: " .. data.name)
end)

Events.NaninhasUpdate.Add(function(data)
    -- Called every in-game minute for each attached plushie.
end)
```

**Integration status:** the current Naninhas source calls `triggerEvent` for these names but does not explicitly register the custom events with `LuaEventManager.AddEvent`. The Lua example therefore depends on those events being registered in the runtime before the listener is installed. Treat this hook as experimental until registration and load order are validated in-game. The TypeScript `EventEmitter` constructor can register a named event when used by a PipeWrench-based consumer, but that does not establish a Naninhas load-order guarantee.

The network commands and the `Naninhas` player modData key are internal implementation details, not public extension APIs. See [How Naninhas works](architecture.md) for their current shape.
