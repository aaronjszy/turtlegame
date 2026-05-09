# Baby Gopher Turtle — Game Design Document

## Overview

A cozy 3D turtle simulator for kids. You play as a baby gopher tortoise living in a sunny Florida scrub habitat. There are no levels, no fail states, and no game over screen — just the gentle daily life of a turtle: eat, bask, dig, and slowly grow up while filling your burrow with animal friends.

**Target audience:** Age 5–8  
**Platform:** Web browser (desktop)  
**Perspective:** Third-person, camera follows behind the turtle  
**Session length:** 10–20 minutes (open-ended, can be left and returned to)

---

## Tech Stack

- **Three.js** — 3D rendering in the browser
- **Vanilla JavaScript** (or lightweight bundler like Vite) — no heavy framework needed
- **Low-poly / cartoon art style** — fast to render, charming, age-appropriate
- **No backend required** — game state saved to localStorage

---

## Art Direction

**Tone:** Warm, sunny, soft. Think a children's picture book come to life.

**Color palette:**
- Sandy yellows and warm oranges for the scrub floor
- Dusty greens for scrub oaks and palmettos
- Bright reds and purples for berries
- Deep blue sky with a few puffy white clouds

**3D style:** Low-poly with flat shading. No textures needed — just solid colors with slight gradients. Characters are chunky and round-edged. The turtle shell has a visible geometric pattern.

**Camera:** Third-person, sitting slightly above and behind the turtle. Smoothly follows movement. Gently bobs when the turtle walks.

---

## The World

One seamless, medium-sized environment. Takes approximately 3–4 minutes to walk across at full turtle speed. The player should never feel lost.

### Areas

| Area | Description | What's here |
|------|-------------|-------------|
| **Central Meadow** | Open sunny scrub, warm sandy ground | Player's burrow entrance, basking spots |
| **Berry Patch** | Dense low shrubs in the northeast corner | Gopher apples, berries, flowers to eat |
| **Scrub Forest Edge** | Shady tree line to the west | Shade, fallen logs, hidden mushrooms |
| **Sandy Clearing** | Open sandy patch to the south | Best basking spot, warm all day |
| **Pond** | Small shallow pond to the northwest | Fresh water, frogs, dragonflies |

### World boundaries
The world is enclosed naturally — thick shrubs, a creek, a road (with a "too scary!" screen shake if approached) — no invisible walls.

### Time of day
A full day/night cycle runs on a real-time loop (~10 minutes per in-game day). Sky color shifts accordingly. At night the world gets darker and cooler, incentivizing returning to the burrow.

---

## The Player — Baby Gopher Tortoise

### Movement
- **WASD / Arrow keys** — walk forward, turn left/right, back up
- **Spacebar** — retract into shell (hide from danger)
- Movement is deliberately slow and deliberate — this is a turtle. That's the charm.
- The turtle's head looks around slightly as it walks (idle animation)

### Growth Stages
The turtle grows visibly over time as it eats and survives days.

| Stage | Condition to reach | Shell size |
|-------|--------------------|------------|
| Hatchling | Start of game | Very small — fits in your hand |
| Juvenile | 5 in-game days survived, 30 foods eaten | Noticeably bigger |
| Young Adult | 15 in-game days survived, 100 foods eaten | Almost full size |

Growth is visual and celebratory — a little sparkle effect and a friendly message ("You're growing up!").

### Stats (simple, shown as icons not numbers)
- **Hunger** — depletes slowly over time; refilled by eating. Shown as 5 leaf icons.
- **Energy** — depletes while moving; refilled by basking in sun. Shown as 5 sun icons.
- If hunger or energy get low, the turtle moves slower. Neither ever hits zero — they just nudge the player toward food or sun.

---

## Core Gameplay Loop

### Daily Routine

```
Wake up in burrow → Emerge into world → Eat & explore → Bask in sun
→ Dig/improve burrow → Return home before dark → Sleep → Repeat
```

### Eating
- Food items are scattered around the world and respawn each in-game day
- Walk over food to eat it automatically (no button press needed)
- Satisfying crunch/munch sound and a little bounce animation when eating
- **Foods:** Gopher apple (best, rarer), palmetto berry (common), flower (common), mushroom (scrub forest only), grass (everywhere)

### Basking
- Walk into a designated sunny patch (glows slightly gold)
- Stand still for a few seconds → energy slowly refills
- A little "ahhh" sigh sound plays and the turtle's eyes half-close
- Basking spots are less effective in the evening as the sun lowers

### Digging / Burrow
- Walk up to your burrow entrance and press E to dig
- Each dig session costs some energy but expands the burrow slightly
- The burrow is visible as a cross-section underground view when you enter it
- A bigger burrow unlocks space for more animal friends (see below)

### Sleeping
- Enter the burrow at night → game fades to a starry sky → time-lapse to morning
- A short "day summary" shows: foods eaten, how much you grew, any new friends

---

## The Burrow & Animal Friends

This is the heart of the progression system.

### How it works
As the burrow grows, animal friends appear at the entrance and ask (with a speech bubble) if they can move in. The player walks up to them to say yes.

Each friend appears in the burrow's cross-section view and says something cute when visited.

### Animal Roster

| Animal | Burrow size needed | Personality |
|--------|-------------------|-------------|
| **Florida Cricket Frog** | Starter (always first) | Cheerful, loves rain |
| **Eastern Indigo Snake** | Small burrow | Cool and calm, protective |
| **Gopher Frog** | Small burrow | Shy, only comes out at night |
| **Burrowing Owl** | Medium burrow | Wise, asks lots of questions |
| **Armadillo** | Medium burrow | Clumsy, very enthusiastic |
| **Scarlet Snake** | Large burrow | Dramatic, colorful |
| **Gopher Mouse** | Large burrow | Tiny, brings you food gifts |

When all 7 friends have moved in, a celebration plays — confetti, everyone cheers — and a "Full House!" message appears. The game continues forever after this.

---

## Danger & Adversity

Gentle adversity — enough to create exciting moments without causing distress.

### The Hawk
- Periodically circles overhead (visible shadow on ground first)
- If the turtle is in an open area when the hawk swoops: screen shakes, the turtle gets startled, loses a little hunger
- **Hiding spots:** under shrubs, near logs, inside the burrow — hawk won't swoop near these
- **Shell mechanic:** Press spacebar to duck into shell anywhere — hawk passes without effect
- The hawk is not mean-looking — it's just doing hawk things. No scary sound effects.

### The Raccoon
- Appears near the burrow entrance in the late evening/night
- Nudges the turtle away from the burrow, delaying sleep
- Walk past it (it shuffles aside after a moment) or wait it out
- More funny than scary — it's just a raccoon being nosy

### The Road
- A dirt road runs along one edge of the world
- Walking toward it triggers a screen shake and a gentle "too dangerous!" message
- Invisible "instinct" — the turtle just won't go there. Teaches road safety subtly.

### Philosophy
- No health bar, no death, no game over
- Adversity creates memorable moments ("the hawk scared me!") not frustration
- A 6-year-old should always feel like they're doing fine

---

## UI & HUD

Minimal and friendly. No numbers, just icons.

```
Top-left:  🍃🍃🍃🍃🍃  (hunger leaves — filled/empty)
Top-right: ☀️☀️☀️☀️☀️  (energy suns — filled/empty)
Bottom-center: small day counter ("Day 3") and a tiny moon/sun icon showing time of day
```

- Speech bubbles appear above animals when approached
- A small "!" appears above the burrow entrance when a new animal friend is waiting
- No mini-map — the world is small enough to learn by heart

---

## Audio

- **Background:** Gentle ambient nature sounds — wind, crickets, birdsong. Shifts to night sounds (owls, frogs) at night.
- **Eating:** Soft crunch/munch
- **Basking:** Contented sigh, gentle warm hum
- **Digging:** Soft scraping sounds
- **Hawk:** Whoosh + light thump if startled
- **Friend moves in:** A little cheerful jingle
- **Growing up:** A warm celebratory chime
- **Music:** Soft, looping acoustic guitar/ukulele melody. Quiet enough to not intrude.

---

## Progression Summary

```
Day 1:  Hatchling explores, eats first food, Cricket Frog moves in
Day 3:  Burrow big enough for a second friend
Day 5:  Turtle visibly bigger (Juvenile stage)
Day 8:  Half the animal friends moved in
Day 15: Young Adult stage, Full House celebration possible
Day 15+: Freeform play continues indefinitely
```

---

## Out of Scope (for v1)

- Multiple save slots
- Mobile / touch controls
- Sound settings / accessibility options
- Multiple worlds or biomes
- Multiplayer

These could all be added later but shouldn't block the first playable version.

---

## Open Questions

- [X] Does the turtle have a name the player can set at the start? YES.
- [X] Should there be a brief intro sequence (hatching from egg)? YES.
- [X] What does the burrow cross-section look like — simple 2D panel or 3D interior? You pick!
- [X] Should animal friends have dialogue that changes over time, or just a greeting? You decide!
