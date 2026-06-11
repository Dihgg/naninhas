# 🧸 Naninhas Mod

## Project Zomboid Plushie Buffs

<p align="center">
  <img src="./steam/preview.png">
</p>

This mod introduces the concept of "naninhas" to AuthenticZ attachable plushies!

Each plushie will give a different bonus when attached to the backpack!

## Requirements

This mod requires one of the **[Authentic Z](https://steamcommunity.com/sharedfiles/filedetails/?id=2335368829)** mods that allows attachable items, either:
- Authentic Z (full mod)
- AuthenticZBackpacks+ (only the backpacks)

## Links

- [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=3624617298)
- [GitHub Repository](https://github.com/dihgg/naninhas)


## 🦸‍♀️ Support!
<hr/>
<br/>
<p align="center">
  <strong>Found this mod fun or useful? You can support its development!</strong>
</p>
<p align="center">
  <a href="https://buymeacoffee.com/dihgg">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-yellow?logo=buymeacoffee" alt="Buy Me a Coffee">
  </a>
</p>
<hr/>

## ✊ Buffs

Each plushie grants a unique bonus when attached to your backpack. Only one plushie can be equipped at a time, and buffs are active while equipped.

| 🧸 **Plushie**              | ✨ **Effect /Buff**                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **🦡 Boris The Badger**     | Grants `Cats Eye's` trait (Better night vision)                                                                                               |
| **🧸 Doll**                 | Grants `Eagle Eyed` trait (better field of vision)                                                                                            |
| **🦩 Flamingo**             | Grants `Graceful` trait (Makes less noise when moving)                                                                                        |
| **🐇 Fluffyfoot The Bunny** | Grants `LightEater` trait (reduces the amount the player needs to eat)                                                                        |
| **🦊 Freddy The Fox**       | Grants `Inconspicous` trait (reduces the chance of being spotted by zombies)                                                                  |
| **🐿️ Furbert The Squirrel** | Grants `Outdoorsy` trait (This trait reduces the chance of catching a cold and lowers the chance of scratches from trees. Improves foraging.) |
| **👶 Green Sci-Fi Goblin**  | Grants `Fast Learner` trait (Increases XP gain)                                                                                               |
| **🐾 Moley The Mole**       | Slight boost to Foraging efficiency XP gain                                                                                                   |
| **🐶 Otis the Pug**         | Grants `Fast Reader` trait (Takes less time to read books)                                                                                    |
| **🦔 Pancake The Hedgehog** | Slight boost to sprinting and Agility XP gain                                                                                                 |
| **🐾 Jacques The Beaver**   | Slight boost to Carpentry XP gain                                                                                                             |
| **🦝 Spiffo**               | Grants bonus to endurance while equipped                                                                                                      |
| **🐾 Spiffo Blueberry**     | Grants `LowThirst` trait (You need to drink less water)                                                                                       |
| **🍒 Spiffo Cherry**        | Grants `Organized` trait                                                                                                                      |
| **🦝 Spiffo PAWS (Gray)**   | Slight boost to Nimble, Blades & Blunt XP gains                                                                                               |
| **❤️ Spiffo Heart**         | Slight boost to First Aid XP gain                                                                                                             |
| **🌈 Spiffo Rainbow**       | Small bonus to reduce Boredom, Fatigue and recover Fatigue                                                                                    |
| **🎅 Spiffo Santa**         | Reduces Boredom slowly                                                                                                                        |
| **🍀 Spiffo Shamrock**      | Slight boost to Aiming and Reloding XP gain                                                                                                   |
| **🐾 Substitution Doll**    | Grants `Brave` trait                                                                                                                          |
| **🐻 Toy Bear**             | Reduces Panic and Stress                                                                                                                      |
| **🐻 Toy Bear (Small)**     | Same as ToyBear but slightly lower effect                                                                                                     |

## 🌎 Translations

Translations are maintained in JSON under [src/translations-json](src/translations-json).

During `npm run postbuild`:
- Build 42 output is generated as `.json` files in `42/media/lua/shared/Translate/<LANG>/<NAMESPACE>.json`

---

# Development
## 👩‍💻 API
Other mods can interact with **Naninhas** by using the `Events`.

### Equipped / Unequipped / Update
Each Plushie will trigger custom events that can be listened.
```lua
  Events.NaninhasEquipped.Add(function(data) { });

  Events.NaninhasUnequipped.Add(function(data) { });

  Events.NaninhasUpdate.Add(function(data) { });
```

On Typescript, this is how it would looks like:

```typescript

import * as Events from "@asledgehammer/pipewrench-events";
import { EventsEnum } from "@constants";
import type { EventData } from "@types";

new Events.EventEmitter<(data: EventData) => void>(EventsEnum.Update)
  .addListener((data) => {
	  print(`Updating Plushie ${data.name} with traits:`, tostring(data.addedTraits), "and XP boosts:", tostring(data.xpBoosts));
  }
);
```

The `data` structure is the following

| Property | Type | Description |
|----------|-------|------------|
| data.name | `string` | The plushie name |
| addedTraits | `Array<string>` | Array of Traits the plushie grants |
| suppressedTraits | `Array<string>` | Array of Traits the plushie will suppress. |
| xpBoosts | `Table<string,number>` | A Set of Perks and boosts (e.g { perk = Perks.Aiming , value = 5 }) |


---

## Architecture

Naninhas uses a **unified server-authoritative model** for all game modes (single player / multiplayer).

**Key principles:**
- Client detects attachment changes and publishes desired plushie set
- Server validates and reconciles trait/XP state authoritatively
- Observer pattern handles event emission for external mods
- Trait and XP application is **ALWAYS** server-side, never client-side

### Logic Flow (All game Modes)

```mermaid
flowchart TD
    T["⏱ everyOneMinute"] --> U["Naninhas.update()"]
    U --> C["Scan currently attached plushies"]
    C --> D{"Compare against known active set"}
    D -->|Newly attached| E["Fire <code>NaninhasEquipped</code> event"]
    D -->|Newly detached| F["Fire <code>NaninhasUnequipped</code> event"]
    D -->|Still active| G["Fire <code>NaninhasUpdate</code> event"]
    E --> H["syncPublisher.tick()"]
    F --> H
    G --> H
    H --> I["Attachment set changed since last sync?"]
    I -->|No| J["Wait for next cycle"]
    I -->|Yes| K["Send <code>SyncDesiredPlushies</code> to Server"]
    K --> L["<strong>Server:</strong> Validate schema and revision"]
    L --> M["<strong>Server:</strong> Verify attachments server-side"]
    M --> N["<strong>Server:</strong> Reconcile traits/XP"]
    N --> O["<strong>Server:</strong> Apply to player and persist <code>modData</code>"]
    O --> P["<strong>Server:</strong> Reply <code>SyncAppliedPlushies</code>"]
    P --> Q["<strong>Client:</strong> Update <code>lastKnownNames</code>"]
    Q --> J
```

### Single Player

In single player, plushie buffs are still applied *server-authoritatively*, as the single player is also a server that runs in the local game process.

### Multiplayer

Multiplayer introduces latency, so the flow should be able to handle stale or out of order requests, this is done by usage of a `revision` number that is synced between server / client

### Network Contract

Module: `Naninhas`

Client -> Server command: `SyncDesiredPlushies`

| Field | Type | Description |
|---|---|---|
| schemaVersion | `number` | Protocol compatibility version |
| revision | `number` | Monotonic client sync counter |
| desiredNames | `string[]` | Desired active plushie names from current attachments |

Server -> Client command: `SyncAppliedPlushies`

| Field | Type | Description |
|---|---|---|
| schemaVersion | `number` | Echoed protocol version |
| revision | `number` | Echoed request revision |
| appliedNames | `string[]` | Names accepted and applied by server |
| rejectedNames | `string[]` | Names rejected by validation |

Validation behavior:
- Unsupported `schemaVersion` is rejected safely.
- Stale `revision` is rejected to avoid out-of-order application.
- Unknown plushie names are rejected.
- Server verifies plushies are actually attached before applying.


## 👩‍💻 Repository Badges
### Code Coverage
<table>
  <thead>
    <tr>
      <td><strong>MAIN</strong></td>
      <td><strong>RELEASE</strong></td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <a href="https://codecov.io/gh/dihgg/naninhas" target="_blank">
          <img src="https://codecov.io/gh/dihgg/naninhas/branch/main/graph/badge.svg"/>
        </a>
      </td>
      <td>
        <a href="https://codecov.io/gh/dihgg/naninhas" target="_blank">
          <img src="https://codecov.io/gh/dihgg/naninhas/branch/release/latest/graph/badge.svg"/>
        </a>
      </td>
    </tr>
  </tbody>
</table>