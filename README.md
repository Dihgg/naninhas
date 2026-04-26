# 🧸 Naninhas Mod

## Project Zomboid Plushie Buffs

<p align="center">
  <img src="./contents/preview.png">
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
## 👩‍💻 API
Other mods can interact with **Naninhas** by using the `Events`.

### Equipped / Unequipped / Update
Each Plushie will trigger custom events that can be listened.
```lua
  Events.NaninhasEquipped.Add(function(data) { });

  Events.NaninhasUnequipped.Add(function(data) { });

  Events.NaninhasUpdate.Add(function(data) { });
```

The `data` structure is the following

| Property | Type | Description |
|----------|-------|------------|
| data.name | `string` | The plushie name |
| addedTraits | `Array<string>` | Array of Traits the plushie grants |
| suppressedTraits | `Array<string>` | Array of Traits the plushie will suppress. |
| xpBoosts | `Table<string,number>` | A Set of Perks and boosts (e.g { perk = Perks.Aiming , value = 5 }) |


---

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