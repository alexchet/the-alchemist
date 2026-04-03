**THE ALCHEMIST**

*Game Design Reference Document*

Tile-Based \| Turn-Based \| First Person \| Roguelite

**1. Character Creation**

**1.1 Core Attributes**

Every character is defined by six core attributes. These determine base
capabilities, skill ceilings, and guild relationships. Attributes are
set by race and class at creation, then grow through the Practice Track
system.

  --------------------------------------------------------------------------
  **Attribute**    **Abbr.**   **What It Governs**
  ---------------- ----------- ---------------------------------------------
  **Strength**     **STR**     Melee damage, carrying capacity, breaking
                               doors and barriers

  **Endurance**    **END**     Max HP, damage reduction, resistance to
                               fatigue and status effects

  **Agility**      **AGI**     Movement options, dodge chance, stealth
                               effectiveness, trap evasion

  **Arcane**       **ARC**     Spell power, spell slot count, magical item
                               identification

  **Luck**         **LCK**     Critical hit chance, loot quality, trap
                               trigger avoidance, random event outcomes

  **Persuasion**   **PRS**     Dialogue options available, NPC disposition,
                               guild rep gain multiplier
  --------------------------------------------------------------------------

**1.2 Races**

Race sets the shape of your character\'s potential --- the ceiling and
floor of what each attribute can become. Race cannot be changed after
creation.

  ---------------------------------------------------------------------------------
  **Race**       **High         **Low         **Alignment**   **Racial Passive**
                 Ceiling**      Ceiling**                     
  -------------- -------------- ------------- --------------- ---------------------
  **Human**      All (balanced) None          Neutral         +1 to ALL guild rep
                                                              gains

  **Dwarf**      END, STR,      ARC,          Good            Stone Sense --- traps
                 Crafting       Persuasion,                   cost 0 actions to
                                AGI                           detect

  **Elf**        ARC,           END, STR      Good            Arcane Memory ---
                 Perception,                                  spells cost 1 less
                 AGI                                          action

  **Halfling**   AGI, Luck,     STR, END      Neutral         Unseen --- -15% enemy
                 Persuasion                                   detection range

  **Tiefling**   ARC,           Social        Neutral         Infernal Resilience
                 Persuasion,    penalty                       --- resist corruption
                 END                                          

  **Orc**        STR, END,      ARC,          Neutral         Bloodlust --- each
                 Intimidation   Persuasion,                   kill restores 2 HP
                                Luck                          

  **Undead\***   END, ARC       No natural HP Evil            Already Dead ---
                                regen                         Minotaur ignores you
                                                              +200 actions
  ---------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  *\* Undead and Alchemist\'s Subject are unlockable races, available
  after specific run conditions are met.*

  -----------------------------------------------------------------------

**1.3 Classes & Starting Stats**

Class gives you a head start in a direction and unlocks your first
practice tracks. It is not a cage --- it is a launchpad. A Fighter who
picks up a spellbook and uses it every floor will develop Arcane
naturally.

  -----------------------------------------------------------------------------------
  **Attribute**        **Fighter**   **Rogue**   **Mage**   **Ranger**   **Cleric**
  -------------------- ------------- ----------- ---------- ------------ ------------
  **Strength (STR)**   8             4           2          5            5

  **Endurance (END)**  8             4           3          6            7

  **Agility (AGI)**    4             9           4          7            3

  **Arcane (ARC)**     1             2           10         3            6

  **Luck (LCK)**       3             7           4          5            3

  **Persuasion (PRS)** 4             4           5          2            6
  -----------------------------------------------------------------------------------

  ---------------------------------------------------------------------------
  **Class**        **Starting Equipment & Guild Bonus**
  ---------------- ----------------------------------------------------------
  **Fighter**      Heavy armour proficiency, longsword. Fighters Guild starts
                   at Known+50.

  **Rogue**        Lockpick tools, short sword, Trap Sense passive. Thieves
                   Brotherhood starts at Known+50.

  **Mage**         3 spell slots, spellbook, Identify passive. Mages
                   Collegium starts at Known+50.

  **Ranger**       Bow & quiver, partial floor map on entry. Rangers Guild
                   starts at Known+50.

  **Cleric**       Holy symbol, Heal ability (1/floor), mace. Healers Order
                   starts at Known+50.

  **Shadow**       Shadow Step (1/floor), dark vision passive, daggers.
                   Shadow Conclave starts at Known+50. Inquisition starts at
                   Known-30.

  **Cultist\***    Corruption ability, demonic sight, cursed blade. Cult of
                   the Abyss starts at Member free. Healers Order and
                   Inquisition start Hostile.

  **Alchemist\'s   All stats at 5. No guild bonuses. The Alchemist\'s notes
  Subject\***      reference you from floor 1. Every 10 floors survived, one
                   random stat jumps +3.
  ---------------------------------------------------------------------------

  -----------------------------------------------------------------------
  *\* Cultist and Alchemist\'s Subject are unlockable classes.*

  -----------------------------------------------------------------------

**2. Practice Track System**

Skills improve through use, not point allocation. Every action you take
in the dungeon is counted. When a threshold is crossed, the next tier
unlocks automatically --- no menu, no screen. The dungeon simply notices
you have become something more.

  -----------------------------------------------------------------------
  *Design principle: The player should never feel like they wasted time.
  A Fighter who lockpicked 40 doors is a Journeyman lockpick. The Thieves
  Brotherhood noticing a Dwarf Fighter who is suspiciously good at locks
  is a better story than a Rogue who was supposed to be.*

  -----------------------------------------------------------------------

**2.1 Lockpicking**

*Tracked by: Number of locks successfully picked*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 picks         Base success rate. Standard lockpick tools
                                   required.

  **Apprentice**   11 picks        +15% success rate. Can see trap difficulty
                                   rating on locked doors.

  **Journeyman**   31 picks        +30% success rate. Picks are silent --- no noise
                                   generated.

  **Expert**       61 picks        +50% success rate. Picks never jam or break.

  **Master**       101 picks       Instant pick on basic and standard locks.
                                   Thieves Brotherhood sends a recruiter --- forced
                                   encounter queued.
  ---------------------------------------------------------------------------------

**2.2 Combat --- Sword**

*Tracked by: Successful sword attacks landed*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 hits          Base damage. No special techniques.

  **Apprentice**   20 hits         +10% damage. Parry ability unlocked (block next
                                   attack).

  **Journeyman**   50 hits         +20% damage. Riposte unlocked (counter after
                                   successful parry).

  **Expert**       100 hits        +35% damage. Sword special move unlocked (unique
                                   per weapon type).

  **Master**       200 hits        +50% damage. Fighters Guild takes notice ---
                                   forced encounter queued.
  ---------------------------------------------------------------------------------

**2.3 Combat --- Axe**

*Tracked by: Successful axe attacks landed*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 hits          Base damage. Axes ignore 5% armour.

  **Apprentice**   20 hits         +10% damage. Cleave --- hits adjacent enemy for
                                   50% damage.

  **Journeyman**   50 hits         +20% damage. Armour ignore increased to 15%.

  **Expert**       100 hits        +35% damage. Sunder --- reduce enemy armour
                                   permanently for the floor.

  **Master**       200 hits        +50% damage. Fighters Guild and Blackblades both
                                   take notice.
  ---------------------------------------------------------------------------------

**2.4 Combat --- Bow**

*Tracked by: Successful ranged attacks landed*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 hits          Base ranged damage. Must be 2+ tiles from
                                   target.

  **Apprentice**   20 hits         +10% damage. Can fire from 3 tiles before
                                   entering a room.

  **Journeyman**   50 hits         +20% damage. Pinning Shot --- slows enemy for 2
                                   turns.

  **Expert**       100 hits        +35% damage. Headshot chance (15%) --- stuns for
                                   1 turn.

  **Master**       200 hits        +50% damage. Rangers Guild sends a formal
                                   invitation.
  ---------------------------------------------------------------------------------

**2.5 Combat --- Staff**

*Tracked by: Successful staff attacks landed*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 hits          Base arcane-physical damage. Drains 1 mana on
                                   hit to target.

  **Apprentice**   20 hits         +10% damage. Staff charge --- store 1 spell in
                                   the staff.

  **Journeyman**   50 hits         +20% damage. Arcane burst on every 5th hit ---
                                   AoE pulse.

  **Expert**       100 hits        +35% damage. Spell costs reduced by 1 action
                                   after each hit.

  **Master**       200 hits        +50% damage. Mages Collegium invites you to
                                   lecture. Shadow Conclave also notices.
  ---------------------------------------------------------------------------------

**2.6 Stealth**

*Tracked by: Successful undetected tile movements*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 moves         Standard detection radius applies.

  **Apprentice**   30 moves        Detection radius reduced by 1 tile.

  **Journeyman**   80 moves        Can move through lit rooms at -50% detection
                                   chance.

  **Expert**       150 moves       Enemies have 20% miss chance on their first
                                   attack against you.

  **Master**       250 moves       Shadow Conclave sends a recruiter. Blackblades
                                   also take notice.
  ---------------------------------------------------------------------------------

**2.7 Arcane**

*Tracked by: Spells successfully cast*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 casts         Base spell effects. Standard spell slot count.

  **Apprentice**   15 casts        +15% spell power. Spell components cost 1 less.

  **Journeyman**   40 casts        Spell combos unlock --- chain two spells for
                                   bonus effect.

  **Expert**       80 casts        All spells cost 1 less action to cast.

  **Master**       150 casts       Mages Collegium sends a formal invitation.
  ---------------------------------------------------------------------------------

**2.8 Persuasion**

*Tracked by: Successful dialogue outcomes (NPC convinced, de-escalated,
or charmed)*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 successes     Standard dialogue options only.

  **Apprentice**   10 successes    See NPC disposition rating before choosing a
                                   dialogue option.

  **Journeyman**   25 successes    Unlock extra hidden dialogue branches in
                                   encounters.

  **Expert**       50 successes    Can de-escalate hostile NPCs (converts them to
                                   neutral once per encounter).

  **Master**       80 successes    Thieves Brotherhood AND Shadow Conclave both
                                   send recruiters --- they arrive on the same
                                   floor. You must choose.
  ---------------------------------------------------------------------------------

**2.9 Endurance**

*Tracked by: Total damage taken and survived*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 dmg taken     Base HP pool.

  **Apprentice**   100 dmg taken   +10 max HP permanently.

  **Journeyman**   300 dmg taken   10% passive damage reduction.

  **Expert**       600 dmg taken   +25 max HP. Regenerate 1 HP per 10 actions
                                   passively.

  **Master**       1000 dmg taken  Fighters Guild promotes you to Veteran
                                   regardless of quest completion.
  ---------------------------------------------------------------------------------

**2.10 Perception**

*Tracked by: Traps found and secrets / hidden passages discovered*

  ---------------------------------------------------------------------------------
  **Tier**         **Threshold**   **Unlocks**
  ---------------- --------------- ------------------------------------------------
  **Novice**       0 found         Nothing hidden visible. Standard enemy
                                   awareness.

  **Apprentice**   5 found         Trap tiles have a subtle visual tell (floor
                                   texture shift).

  **Journeyman**   12 found        Secret doors pulse faintly when adjacent.

  **Expert**       22 found        See enemy detection cones on the tile map.

  **Master**       35 found        Rangers Guild sends a scout to find you
                                   personally.
  ---------------------------------------------------------------------------------

**3. The Guild System**

**3.1 Discovery Rules**

**Guilds are not selected from a menu. They are found.** Each floor has
a 25% base chance to spawn a hidden Guild NPC tile. The player must find
them physically. The first encounter with any guild is always a fresh
random roll --- no chains exist yet. Reputation decay from enemy guilds
means full allegiance to all ten is impossible. Specialisation is
natural.

**3.2 Reputation & Rank**

Reputation is earned through completing quests, helping guild NPCs, and
making choices that align with a guild\'s values. Enemy guilds lose
reputation whenever you help a rival.

  ----------------------------------------------------------------------------
  **Rank**       **Rep        **Effect**
                 Required**   
  -------------- ------------ ------------------------------------------------
  **Known**      0            Guild is aware of you. NPCs acknowledge you. No
                              perks.

  **Member**     100          Perk 1 unlocks. Guild NPCs will assist in minor
                              ways. First training bonus available.

  **Trusted**    300          Perk 2 unlocks. Access to guild-exclusive items.
                              Second training bonus available.

  **Veteran**    700          Perk 3 unlocks. Guild sends a companion on the
                              next floor after ranking up.

  **Champion**   1,500        Perk 4 unlocks. Permanent guild companion. Named
                              in guild records. Final story branch opens.
  ----------------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Reputation decay rule: Helping Guild A grants +20 rep. Each guild that
  is an enemy of Guild A loses -10 rep automatically.*

  -----------------------------------------------------------------------

**3.3 Guild Overview**

The following table summarises all ten guilds, their alignment, enemies,
and relationship with the dungeon\'s architect.

  --------------------------------------------------------------------------------------
  **Guild**         **Alignment**      **Enemy         **Relationship with The
                                       Guilds**        Alchemist**
  ----------------- ------------------ --------------- ---------------------------------
  **Fighters        **Good**           Blackblades,    Lost a squad inside. Actively
  Guild**                              Cult of the     hunting him. Missing members are
                                       Abyss           now transformed enemies on floors
                                                       6-8.

  **Mages           **Good**           Shadow          He was their expelled student.
  Collegium**                          Conclave,       They trained him. A senior mentor
                                       Necromancer     is secretly still in contact.
                                       Syndicate       

  **Thieves         **Neutral**        Blackblades,    He is their best client. They
  Brotherhood**                        Inquisition     smuggle him ingredients and
                                                       specimens --- some of which are
                                                       people.

  **Healers Order** **Good**           Cult of the     They treat his victims. He has a
                                       Abyss,          spy in their infirmary feeding
                                       Necromancer     him recovery data.
                                       Syndicate       

  **Rangers Guild** **Neutral**        Blackblades,    Mapped the dungeon exterior.
                                       Shadow Conclave Found sealed entrances. One scout
                                                       found an active one and vanished.

  **Blackblades**   **Evil**           Fighters,       He hired them to cull weak
                                       Rangers,        adventurers. He\'s been paying
                                       Thieves         them in alchemically treated gold
                                       Brotherhood     --- slowly changing them.

  **Necromancer     **Evil**           Healers Order,  They want his formula. He sold
  Syndicate**                          Mages Collegium them a deliberately flawed
                                                       version and uses their
                                                       experiments as data.

  **Shadow          **Evil**           Mages           They worship him. Send members as
  Conclave**                           Collegium,      willing subjects. Their leader
                                       Rangers Guild   suspects he plans to dissolve
                                                       them.

  **Cult of the     **Evil**           Fighters,       He stole their demonic texts.
  Abyss**                              Healers, Mages  They want the dungeon back. He
                                       Collegium       holds a Cult member captive as a
                                                       reagent source.

  **Inquisition**   **Neutral/Dark**   Thieves         He was once one of them. He
                                       Brotherhood,    designed the dungeon entrance to
                                       Necromancer     use their presence as a subject
                                       Syndicate       filter.
  --------------------------------------------------------------------------------------

**3.4 Guild Perks by Rank**

Each rank unlocks a passive or active perk. Guild training can also
bypass the Practice Track grind for specific skills --- jumping a track
directly to a higher tier.

  ---------------------------------------------------------------------------
  **Guild**         **Rank**    **Perk / Training Bonus**
  ----------------- ----------- ---------------------------------------------
  **Fighters        Member      Sword track jumps to Journeyman free
  Guild**                       

  **Fighters        Trusted     Warrior\'s Resolve --- Minotaur moves every 3
  Guild**                       actions (was 2)

  **Fighters        Veteran     Endurance track jumps to Journeyman free
  Guild**                       

  **Fighters        Champion    Rage ability unlocked; named in the Hall of
  Guild**                       Records

  **Mages           Member      Arcane track jumps to Apprentice free;
  Collegium**                   Identify is instant and free

  **Mages           Trusted     Rune-reading --- hidden floor sections
  Collegium**                   revealed on map

  **Mages           Veteran     Arcane Seal --- once per run, re-lock a
  Collegium**                   destroyed door

  **Mages           Champion    Spells cost 0 actions once per floor
  Collegium**                   

  **Thieves         Member      Lockpicking jumps to Apprentice; Stealth
  Brotherhood**                 jumps to Apprentice

  **Thieves         Trusted     Black market access --- buy rare items
  Brotherhood**                 between floors

  **Thieves         Veteran     Light Step --- movement costs 0.5 actions
  Brotherhood**                 while Minotaur is released

  **Thieves         Champion    Pickpocket any NPC; access to Brotherhood
  Brotherhood**                 safe rooms

  **Healers Order** Member      Resting costs 2 actions (down from 5) while
                                Minotaur is released

  **Healers Order** Trusted     Poison immunity

  **Healers Order** Veteran     Endurance jumps to Journeyman free;
                                revive-once per run

  **Healers Order** Champion    Free heal at any Healers Order encounter;
                                heal allies in combat

  **Rangers Guild** Member      Partial floor map revealed on entry

  **Rangers Guild** Trusted     Perception jumps to Journeyman free; traps
                                triggered without damage

  **Rangers Guild** Veteran     Minotaur position visible on map at all times

  **Rangers Guild** Champion    Full floor map on entry; bonus damage to
                                specific monster types

  **Blackblades**   Member      Assassination track unlocked (exclusive to
                                this guild)

  **Blackblades**   Trusted     Stealth entry to locked rooms once per floor

  **Blackblades**   Veteran     Trap placement --- stuns Minotaur 15 actions
                                if triggered

  **Blackblades**   Champion    Instant kill on non-boss enemies below 30% HP

  **Necromancer     Member      Curse magic track unlocked (exclusive to this
  Syndicate**                   guild)

  **Necromancer     Trusted     Drain life from undead enemies
  Syndicate**                   

  **Necromancer     Veteran     Raise slain enemies as temporary minions (1
  Syndicate**                   per floor)

  **Necromancer     Champion    Undead decoy --- Minotaur paths to it for 20
  Syndicate**                   actions

  **Shadow          Member      Shadow step through walls once per floor
  Conclave**                    

  **Shadow          Trusted     Stealth jumps to Expert free
  Conclave**                    

  **Shadow          Veteran     Veil of Misdirection --- redirect Minotaur to
  Conclave**                    decoy tile for 30 actions (1/floor)

  **Shadow          Champion    Charm enemy for 3 turns; enemies have 20%
  Conclave**                    miss chance

  **Cult of the     Member      Fear aura on room entry --- enemies hesitate
  Abyss**                       1 turn

  **Cult of the     Trusted     Blood Pact --- Minotaur ignores you this
  Abyss**                       floor (costs 20% max HP)

  **Cult of the     Veteran     Corruption abilities unlock --- debuff all
  Abyss**                       enemies in room

  **Cult of the     Champion    Massive damage boost; corruption check each
  Abyss**                       floor (fail = HP loss)

  **Inquisition**   Member      Detect invisible/hidden enemies passively

  **Inquisition**   Trusted     Immunity to charm and illusion effects

  **Inquisition**   Veteran     Perception jumps to Expert free; Persuasion
                                permanently capped at Journeyman

  **Inquisition**   Champion    Bonus damage to magic-using enemies; action
                                budget reduced by 100/floor (divine judgment)
  ---------------------------------------------------------------------------

**4. The Minotaur**

**The dungeon is not passive. It is hunted.** The Minotaur is not a
monster --- it is a consequence. Released by the Alchemist when he
decides a subject has lingered too long, it pathfinds toward the player
using BFS (shortest path) and cannot be permanently destroyed on most
floors.

**4.1 The Action Counter**

Every meaningful action costs actions from the floor budget. Reaching
zero releases the Minotaur. The counter is hidden until 800 remaining.

  -----------------------------------------------------------------------
  **Action**                          **Cost**
  ----------------------------------- -----------------------------------
  Move one tile                       1

  Attack                              1

  Open a door                         1

  Pick up an item                     1

  Use an item                         1

  Dialogue choice with NPC            1 per choice

  Search for traps                    2

  Identify an item                    2

  Pick a lock                         3

  Rest / heal                         5

  Check inventory / map / journal     **0 (free)**

  Save the game                       **0 (free)**
  -----------------------------------------------------------------------

**4.2 Counter States**

  ---------------------------------------------------------------------------
  **Actions       **State**      **Effects**
  Remaining**                    
  --------------- -------------- --------------------------------------------
  **1,000 --      **Safe**       No indicator. Player unaware of the clock.
  801**                          

  **800 -- 501**  **Uneasy**     Counter appears on HUD. Distant rumbling
                                 audio. No label, just a number.

  **500 -- 201**  **Danger**     Counter turns amber. Louder rumbling. Dust
                                 falls from ceiling tiles. Minotaur is awake
                                 but sealed.

  **200 -- 1**    **Critical**   Counter turns red. Heartbeat audio. Wall
                                 cracks near dungeon entrance.

  **0**           **Released**   Minotaur spawn tile cracks open. BFS
                                 pathfinding to player begins immediately.
  ---------------------------------------------------------------------------

**4.3 Movement Rules**

  -----------------------------------------------------------------------
  **Condition**                       **Minotaur Moves Every\...**
  ----------------------------------- -----------------------------------
  First 200 actions after release     **Every 2 player actions**

  After 200 actions of chasing        **Every 1 player action
                                      (accelerates)**

  Fighters Guild Veteran perk active  **Every 3 player actions**

  Cult of the Abyss Blood Pact used   **Does not move this floor**

  Carrying Healers Order scent        **Starts next floor at +1 speed
  (escaped below 50 actions)          permanently**
  -----------------------------------------------------------------------

**4.4 Combat Outcomes**

  -----------------------------------------------------------------------
  **Depth**     **Combat Result**
  ------------- ---------------------------------------------------------
  **Floors      Minotaur is beatable, barely. Victory: it retreats,
  1--3**        re-seals, +200 action budget bonus next floor. Rare drop:
                Minotaur Horn (Fighters Guild quest item).

  **Floors      Minotaur is extremely difficult. Victory requires high
  4--7**        Endurance and combat track mastery.

  **Floors 8+** Minotaur is effectively unkillable. Flight is the only
                option.

  **Caught**    Combat initiates regardless of depth. Defeat = death
                (permadeath mode) or floor reset. Death screen shows
                action count at release: \"The labyrinth claimed you with
                847 actions wasted.\"
  -----------------------------------------------------------------------

**5. Encounter & Quest Chain System**

**5.1 Encounter Roll**

Each floor, the game rolls for encounters. Chains (promised follow-up
encounters from previous player choices) take priority over random
rolls.

  -----------------------------------------------------------------------
  **Roll          **Result**
  (1d100)**       
  --------------- -------------------------------------------------------
  **1 -- 40**     No guild encounter this floor.

  **41 -- 65**    Single random encounter (weighted toward guilds the
                  player has already met).

  **66 -- 85**    Single encounter from the chain queue if one exists;
                  otherwise random.

  **86 -- 100**   Two encounters this floor --- one from chain queue, one
                  random.
  -----------------------------------------------------------------------

**5.2 Chain Queue Rules**

**A chain is a promise the game made to the player.** Once a choice
triggers a follow-up encounter, it enters the chain queue. The queue
holds a maximum of 3 pending chains. Chains have an earliest floor (not
before) and a forced floor (guaranteed by this floor no matter what the
dice say).

  -----------------------------------------------------------------------
  **Floor in        **Chance to       **If Not Fired**  **Hard Force?**
  Window**          Fire**                              
  ----------------- ----------------- ----------------- -----------------
  Earliest floor    30%               Continue to next  No
  (N+2)                               floor             

  Middle floor      55%               Continue to next  No
  (N+3)                               floor             

  Late floor (N+4)  80%               Continue to next  No
                                      floor             

  **Final floor     **100%**          **---**           **YES ---
  (N+5)**                                               guaranteed**
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Chain priority: If two chains are due on the same floor, the one
  closest to its deadline fires first. The other has its window extended
  by 2 floors automatically.*

  -----------------------------------------------------------------------

**5.3 Chain Expiry**

If a chain expires without firing (player skipped floors via shortcut,
or the window passed), it auto-resolves off-screen. The player receives
a brief flavour note:

  -----------------------------------------------------------------------
  *\"Somewhere above, you hear fighting. The Fighters Guild soldier
  didn\'t make it.\" --- The flag is set to its failed state. No reward,
  but the story closes cleanly.*

  -----------------------------------------------------------------------

**6. The Alchemist**

**The dungeon is not a random place. It is a laboratory.** The Alchemist
has been running his experiment longer than any guild has existed. He is
obsessed with a single question: *\"What is the perfect being?\"* The
player is his latest subject. The Minotaur is his control variable ---
the thing that culls the weak so only the worthy survive to the bottom.

**6.1 His Presence by Floor Range**

  -----------------------------------------------------------------------
  **Floors**    **Alchemist Behaviour**
  ------------- ---------------------------------------------------------
  **1 -- 3**    Passive observation. Scratching sounds in walls. Clinical
                notes pinned to surfaces referencing the player
                specifically.

  **4 -- 6**    Active testing. Trap layouts change if the player finds a
                pattern. Corridors reroute after 200 actions on a floor.
                Guild NPCs begin disappearing --- he removes variables he
                finds unhelpful.

  **7 -- 9**    Direct contact via speaker tube. He talks to the player
                --- not threatening, curious. Almost friendly. He offers
                a deal.

  **10**        The Laboratory. The guilds\' missing members are here.
                The Minotaur\'s origin is here. He has been expecting the
                player since floor 1.
  -----------------------------------------------------------------------

**6.2 The Deal (Floor 7)**

  -------------------------------------------------------------------------
  **Choice**      **Outcome**
  --------------- ---------------------------------------------------------
  **Accept**      Minotaur deactivated for 3 floors. Action budget doubled.
                  Guilds hunting the Alchemist lose 30 rep with player ---
                  they will know something changed.

  **Refuse**      He is delighted. \"Good. Compliance would have
                  disqualified you.\" Nothing changes. He respects the
                  refusal.

  **Negotiate**   Requires Thieves Brotherhood Trusted rank or higher.
                  Counter-offer: guild intelligence for permanent Minotaur
                  slowdown. He accepts. The player has just betrayed every
                  guild that trusted them --- and gained the most powerful
                  ally in the dungeon.
  -------------------------------------------------------------------------

**6.3 Guild Relationships --- What Each Guild Knows**

  ---------------------------------------------------------------------------
  **Guild**         **What They Know**           **What They Don\'t Know**
  ----------------- ---------------------------- ----------------------------
  **Fighters        He took their squad.         The squad is alive ---
  Guild**           They\'ve never recovered the transformed into elite
                    bodies.                      enemies on floors 6--8.

  **Mages           He was their most gifted     A senior mentor still feeds
  Collegium**       student, expelled for live   him research in secret.
                    experiments.                 

  **Thieves         He pays better than anyone.  Some of the \'ingredients\'
  Brotherhood**     No questions asked.          they smuggled were people.

  **Healers Order** They treat everyone he       He has a spy in their
                    breaks. They\'ve documented  infirmary. He uses their
                    hundreds of cases.           healing research to make
                                                 subjects survive longer.

  **Rangers Guild** The dungeon is larger than   One entrance is no longer
                    any explorer has mapped.     sealed. A scout found it and
                    Seven sealed entrances       never came back.
                    exist.                       

  **Blackblades**   He pays them to cull weak    The alchemically treated
                    adventurers.                 gold is changing them. He is
                                                 experimenting on them too.

  **Necromancer     He cracked animated flesh    He sold them a deliberately
  Syndicate**       that retains the mind. They  flawed version. Their
                    want the formula.            experiments feed data back
                                                 to him.

  **Shadow          They worship his work. They  Their leader suspects he
  Conclave**        send members as willing      plans to dissolve the
                    subjects.                    Conclave once he is done
                                                 with them.

  **Cult of the     He stole their demonic texts He holds a Cult member
  Abyss**           and corrupted their sacred   captive on floor 9 as a
                    beast.                       living reagent source.

  **Inquisition**   The dungeon is a site of     He was once one of them. He
                    corruption. They guard the   designed the entrance
                    entrance.                    intimidation to use them as
                                                 a subject filter.
  ---------------------------------------------------------------------------

**7. Recommended Build Order**

This is the recommended implementation sequence. Each phase produces a
playable loop before the next phase begins.

  ------------------------------------------------------------------------
  **Phase**   **Name**         **Milestone Features**
  ----------- ---------------- -------------------------------------------
  **Phase 1** **The Dungeon    Dungeon generator (rooms + corridors),
              Lives**          spawn points, basic enemy AI, combat
                               system, death/game over

  **Phase 2** **The Dungeon    Item system, inventory, doors
              Has Stuff**      (open/locked), traps, stairs, floor
                               progression

  **Phase 3** **The Dungeon    Action counter, the Minotaur, NPC spawning,
              Remembers**      basic dialogue, guild reputation skeleton

  **Phase 4** **The Dungeon    Full guild encounter system, chain quest
              Has Meaning**    system, practice track system, race/class
                               selection

  **Phase 5** **The Dungeon    The Alchemist\'s presence, floor 10
              Has a Mind**     laboratory, multiple endings, unlockable
                               races and classes
  ------------------------------------------------------------------------

*THE ALCHEMIST --- Game Design Reference v1.0*
