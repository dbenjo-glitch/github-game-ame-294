# Master AI Prompt Log & Workflow Analysis

**Course:** AME 294: Games and AI, Creating Games with Artificial Intelligence
**Assignment:** Portfolio Game 2, Vibe-Coded Browser Game
**Student Name:** David Benjo
**Project Title:** Boom Snake
**Repository URL:** https://github.com/dbenjo-glitch/github-game-ame-294
**Itch.io URL (Optional Bonus):** [TBD]

---

## 1. Toolchain & AI Session Inventory

| Category | Primary Tool / Platform | Model Version / Specification | Purpose in Project |
| :---- | :---- | :---- | :---- |
| **Code Scaffolding Agent** | Claude (Cowork, running in the Chrome side panel) | claude-opus-5-5 | Project structure, Phaser 3 setup, all five scenes |
| **Logic & Debugging Agent** | Claude (Cowork) | claude-opus-5-5 | Mechanics, state handling, automated browser playthroughs, bug fixes |
| **Audio / SFX Generator** | ElevenLabs Sound Effects (paid plan) | Sound Effects v2 | Five sound effects: boom, thump, womp, redeem, victory |
| **Music / Atmosphere** | ElevenLabs Sound Effects, then ElevenLabs Chat (creative agent, Alpha) | Sound Effects v2 and Eleven Music v2 | 19 second looping arcade chiptune background track |
| **Visual Asset Pipeline** | None. All visuals are drawn in code with Phaser shapes | | Tiles, mines, flags, snake, apples, UI |

Cursor was the original plan (it was the Week 5 lab tool). The student switched to Claude before any code was written because neither Cursor, Claude Code nor Codex was set up on his machine.

---

## 2. Code Development Prompts (Reward, Damage, End Loop)

All prompts below are the student's exact words, typos included, in the order they were sent on `2026-10-07`.

### 2.0 Planning Session

* **Agent Used:** Claude (Cowork)
* **Target Objective:** Set up the workspace and get a step-by-step build plan.

#### Exact Prompt Submitted:

> open a cursor tab as well, as well as github, lets use claude and cursor to complete this assignment, also open an eleven labs tab. then provide me a step by step way to complete this, and ill have you auto fill the log as we go. for example for step one you might say, We need a xyz? decide an x y z

#### Agent Output Summary & Key Changes:

* Opened Cursor, GitHub and ElevenLabs tabs and produced an 8-step plan with time boxes.
* Claude's default suggestion was a simple catch-and-dodge game. The student replaced it with his own concept (below).

### 2.1 Concept Direction and Initial Scaffolding

* **Agent Used:** Claude (Cowork)
* **Target Objective:** Lock the rules of the student's original concept, then scaffold `index.html`, the Phaser config and the scene structure.

#### Exact Prompts Submitted:

> how hard would it be to build a minesweeper game, that if you hit a bomb, you get tunneled to another game which you must beat to get redemption/back into minesweeper. for example, you hit a bomb and now need to play snake until you get 15 apples, in order ot continue minesweeper

> lets do this, redemption 1 is get 10 apples on snake, redemtion 2 is 20 apples, and redemption three you need to get 30. there is no redemption 4.

> can i use just claude code or codex, no cursor. for the assignment?

> i have neither set up, lets do it with claude

#### Agent Output Summary & Key Changes:

* Claude rated the concept medium difficulty and proposed scope caps: 8x8 board, 10 mines, code-drawn shapes, and a flat 8 to 10 apple target.
* **Human decision:** the student rejected the flat target and designed an escalating ladder instead (10, 20, 30 apples, and a fourth bomb ends the run).
* Claude scaffolded the project with no build step: `index.html` loading plain script tags, Phaser 3.90 vendored in `lib/`, and one file per concern (`config.js`, `state.js`, `board.js`, `audio.js`, `ui.js`, five scene files, `main.js`).
* Key architecture choice: the Minesweeper board lives in a shared `State` object, not in the scene, so it survives the trip into Snake and comes back exactly as the player left it.
* Base size 480x720 with `Phaser.Scale.FIT`, so one layout serves desktop and phones in portrait.

### 2.2 Core Loop Mechanics

#### Exact Prompt Submitted (covers Reward, Damage and End):

> for step 1, we have out theme down, our reward is tht when you win a screen pops up with how long you took to win, and in the backround the snake starts eating everywhere there was a mine also a victory noise plays (create a template for me to create a prompt for eleven labs for this sound), when you win in snake a sound plays as well, and a hole is made on one of the walls, and your snake just goes through the hole and transports you back to mineseeper damage will be hitting a bomb (create a template for me to create a prompt for eleven labs for this sound) and another damage sound will be hitting a wall in snake (create a template for me to create a prompt for eleven labs for this sound), and damage sound for snake will be a thump and then a arcade like womp womp womp womp, and damage for mine sweeper will be a boom sound and then if you lose and have no more redemptions left the same womp womp womp womp sound will play.

#### A. Reward Mechanic

* **Agent pushback:** Claude pointed out that the win screen the student called the "reward" is the End state under the rubric, and that the graded Reward should be points for a successful action. The student's design was kept as written and a score was added underneath it.
* **Implementation Outcome:** +10 points for every safe tile revealed (a cascade pays for every tile it opens) and +5 for every apple. Reaching the apple target plays `redeem.mp3`, opens a hole in the wall straight ahead of the snake, and the snake drives itself out and back to Minesweeper.

Follow-up prompts that added a second reward layer:

> we can also add different colored snakes to our rewards, for exmaple every win you get you get 4 coins, -1 per redemption used, it costs 20 coins to buy a new snake color. that could also be the reward

> i agree with your poinr on the pricing of the colors, why does adding anything take so much time, isnt ai doing most of it

* **Agent pushback:** at 4 coins per perfect win, a 20 coin color takes five wins, so a grader would never see the shop work. Claude proposed a cheap first unlock.
* **Human decision:** the student agreed. Final prices are 4, 10 and 20 coins, which keeps his original 20 as the top tier.
* **Implementation Outcome:** a win pays 4 coins minus 1 per redemption used. Coins and owned colors are saved in the browser. The shop is on the start screen and the chosen color is used in Snake and in the win animation.

#### B. Damage Mechanic

* **Implementation Outcome:** revealing a mine plays `boom.mp3`, shakes and flashes the screen, spends one redemption, then zooms the camera into the crater and fades into Snake. In Snake, hitting a wall or the snake's own body plays `thump.mp3` followed by `womp.mp3` and ends the run.

#### C. End State & Win/Loss Conditions

* **Implementation Outcome (win):** when every safe tile is open, `victory.mp3` plays and a panel pops up with the time taken. Behind it a snake crawls across the solved board and eats every mine, taking the nearest one next each time.
* **Implementation Outcome (loss):** two ways to lose. A fourth bomb plays `boom.mp3` then `womp.mp3` and shows "Fourth bomb. There is no redemption 4." Crashing in Snake shows "The snake crashed. No redemption."
* Both end screens offer Play Again and Menu.

### 2.3 Wiring Up the Web Audio API & Audio Triggers

* **Agent Used:** Claude (Cowork)
* **Target Objective:** Load the audio files, attach them to the Reward, Damage and End events, and unlock browser audio on a user gesture.

#### Exact Prompt Submitted:

The audio behavior was specified in the 2.2 prompt above ("a thump and then a arcade like womp womp womp womp", "a boom sound and then ... the same womp womp womp womp sound").

#### Implementation Outcome:

* The start screen shows "CLICK OR PRESS SPACE TO START". That handler resumes the Web Audio context before the first sound is needed.
* `audio.js` owns all playback. `SFX.chain(first, second)` plays the second sound on the first one's `complete` event, which is how "thump then womp" and "boom then womp" are built from three files instead of five.
* Each sound has its own volume in `config.js` so chained sounds do not clip.
* Every play call first checks that the file loaded, so a missing sound never crashes the game.

### 2.4 Workflow Prompt

> lets have 2 things running at once, lets have 1 agent taking care of the things, and a second asking me questions for the project, that way claude can work while i work too and im not waiting on claude and claude isnt waiting on me

* **Outcome:** the work was split into two tracks. Claude built and tested the game while the student generated the sounds in ElevenLabs and answered design questions (title, inspiration, plan details).

> 3. title: Boom Snake

* **Outcome:** the working title "Minesweeper: Redemption" was replaced with the student's title.

### 2.5 Background Music Wiring

> im currently in eleven labs, track down all the prompt used to create take 7, i want to use take 7 as the backroudn track for the game

> now find the prompts it took to make this sound, it first started in soun affects then i moved into chats, then update the prompt logs

* **Outcome:** Claude read the student's ElevenLabs Sound Effects history and Chat thread and reconstructed the full prompt chain (section 3.4).
* **Implementation Outcome:** `audio.js` gained `SFX.startMusic()`, which loops the track at volume 0.22 so it sits under the effects. It is started from the same click that unlocks audio and is owned by the game's sound manager, so it keeps playing across every scene change. A guard makes sure only one copy ever plays.

---

## 3. Generative Audio & Sound Design Prompts

Prompt template used for every sound (structure drafted with Claude, wording chosen by the student):
`[sound source], [tone or texture], [shape: how it starts and ends], [style or era], no [what to leave out]`

### 3.1 Sound 1: Reward SFX (redemption cleared)

* **Tool:** ElevenLabs Sound Effects
* **Exact Prompt:** [TBD]
* **Settings (duration, prompt influence):** [TBD]
* **Iterations / what changed between takes:** [TBD]
* **Final file:** `assets/audio/redeem.mp3`
* **Trigger in game:** Snake apple target reached, as the hole opens in the wall.

### 3.2 Sound 2: Damage SFX (two sounds)

**2a. Bomb hit**

* **Tool:** ElevenLabs Sound Effects (Sound Effects v2)
* **Exact Prompt:** "Small land mine explosion, retro arcade sound, tight punchy low thump, crackling texture on top, sound fades out, no sudden end"
* **Settings:** four takes generated, 2.3 seconds each. Take #4 chosen.
* **Final file:** `assets/audio/boom.mp3`
* **Trigger in game:** Revealing a mine in Minesweeper.

How the prompt was built. Claude supplied a fill-in template: `[size] [style] explosion, [low-end character], [texture on top], [how it ends], no [exclude]`. The student filled it in and asked about the one slot he did not understand:

> Small, land mine explosion, [low-end character], Crackling texture on top, sound fades out, no sudden end.
>
> what should i put for low end charcter, what does that mean?

* Claude explained that "low end" is the bass weight of the sound and offered three options from light to heavy. The student's draft said "small", so the lightest one ("tight punchy low thump") was used.
* Claude flagged that the draft had no style word, so the result would probably be a realistic explosion that might not match the chiptune music.

> can you add arcade sound in it

* **Human decision:** the student chose to match the music and added "retro arcade sound".

Post-processing (done by Claude with ffmpeg, no AI generation):

* **Latency fix:** the take opened with 0.53 seconds of near silence before the explosion. Left in, the boom would have landed half a second after the click. The lead-in was cut so the sound starts within 4 milliseconds.
* **Clipping fix:** the peak sat at 0.0 dB with 35 clipped samples. Gain was lowered by 1.5 dB.
* A 0.12 second fade was added at the end, and the WAV was converted to MP3. Final length 1.75 seconds.

**2b. Snake crash**

* **Tool:** ElevenLabs Sound Effects
* **Exact Prompt:** [TBD]
* **Settings:** [TBD]
* **Iterations:** [TBD]
* **Final file:** `assets/audio/thump.mp3`
* **Trigger in game:** Snake hits a wall or its own body.

### 3.3 Sound 3: End State SFX (two sounds)

**3a. Victory**

* **Tool:** ElevenLabs Sound Effects
* **Exact Prompt:** [TBD]
* **Settings:** [TBD]
* **Iterations:** [TBD]
* **Final file:** `assets/audio/victory.mp3`
* **Trigger in game:** Board cleared, win panel with time taken.

**3b. Loss ("womp womp womp womp")**

* **Tool:** ElevenLabs Sound Effects
* **Exact Prompt:** [TBD]
* **Settings:** [TBD]
* **Iterations:** [TBD]
* **Final file:** `assets/audio/womp.mp3`
* **Trigger in game:** Chained after `thump.mp3` on a Snake crash, and after `boom.mp3` on the fourth bomb.

### 3.4 Background Music Loop

* **Final file:** `assets/audio/music.ogg` (with `music.mp3` as a fallback)
* **Trigger in game:** starts on the "Click or press Space to start" gesture and loops for the whole session.

The track took two tools and four student prompts. Everything in quote blocks is the student's exact wording.

**Stage 1: ElevenLabs Sound Effects.** Prompt box settings: Looping on, Duration auto, Prompt influence 50%.

> Instrumental arcade boss loop. Tense chiptune, 140 BPM. Strong downbeat, no vocals, clean ending that can repeat. slight boom beats ever 70 beats

* Result: four takes of 2.3 seconds each. Take #3 was favorited.
* Why it was not enough: 2.3 seconds is far too short for a background track, so the student moved to ElevenLabs Chat and uploaded a loop from this batch as a reference.

**Stage 2: ElevenLabs Chat (creative agent).** The agent writes its own generation prompts from what the student asks for. Both are recorded.

Student prompt 1:

> Make it 5 seconds long, with increasing and decreasing pitches, add a set of back round aracade music that goes with it

* Agent's sound effect prompt (Sound Effects v2, Take 1): "Retro chiptune arcade sound, square wave pitch sweeping up and down in repeating rising and falling arpeggios, bright 8-bit tones"
* Agent's music prompt (Eleven Music v2): "Instrumental arcade chiptune, tense and driving, 140 BPM, square and pulse wave leads, fast arpeggios, punchy 8-bit bass and drums, rising and falling melodic lines"
* **Two failures:** the first two music generations failed with "There was an unexpected error processing this generation" (not charged). Both used the uploaded loop as a reference.
* **Recovery:** the agent retried from the text description only ("Arcade chiptune background music, text-prompt only retry") and produced Take 3, a 15 second track. It follows the style of the uploaded loop but is not built from it.

Student prompt 2 (referencing Take 3):

> i liked  just make it so that it can loop and gradually drops back down in pitch so that it doesnt look by having a major pitch change, make it like a 18-20 second loop or so

* Agent's music prompt: "Seamlessly looping instrumental arcade chiptune, tense and driving, 140 BPM, square and pulse wave leads, fast arpeggios, punchy 8-bit bass and drums. Over the final few bars the melody and bass gradually descend in pitch and ease in energy, settling on the same key and groove as the opening so the loop restarts smoothly with no abrupt pitch jump"
* Result: Takes 4 and 5, 19 seconds each.

Student prompt 3 (referencing Take 4):

> i like this, make it loop seemlessly, the drop is to long and its supposed to drop to around the same level as the beginning, not a lot lower

* Agent's music prompt: "Tighter seamless arcade loop with a short, subtle pitch dip back to the start level. Seamlessly looping instrumental arcade chiptune, tense and driving, 140 BPM, square and pulse wave leads, fast arpeggios, punchy 8-bit bass and drums, steady energy throughout. Only in the last bar the melody dips a small step down, a brief and subtle pitch fall, landing exactly on the starting note, key, and groove of the opening so the end flows straight back into the beginning with no gap or jump"
* Result: Takes 6 and 7. **The student chose Take 7.**
* Cost: 3,171 credits for the chat thread.

**Post-processing (done by Claude with ffmpeg, no AI generation):**

* The download was 19.08 seconds with 0.18 seconds of silence at the end, which would have been heard as a hiccup on every loop.
* It was trimmed to 18.857 seconds, which is exactly 11 bars at 140 BPM, so the loop point lands on a bar line.
* Exported as OGG (loops without a gap) with an MP3 fallback.
* Levels: peak -1.0 dB, so no clipping. Played at volume 0.22 against 0.6 to 0.8 for the effects.

---

## 4. Debugging, Error Recovery & Friction Log

### Incident 1: Audio 404 errors in the console

* **Console error:** `Failed to load resource: the server responded with a status of 404 (File not found)`, five times on every load, one per sound file.
* **Cause:** the code was written before the ElevenLabs files existed, so `assets/audio/` was empty.
* **Why it did not break the game:** in Phaser, playing a sound key that is missing from the cache throws an error. Claude anticipated this and routed every sound through a helper that checks `cache.audio.exists(key)` first, so the game stayed fully playable in silence.
* **Resolution so far:** with the music file added and placeholder tones standing in for the five effects, a scripted playthrough showed zero console errors and every trigger firing in the right order: boom on a bomb, redeem on escape, thump then womp on a Snake crash, boom then womp on the fourth bomb, victory on a win. [TBD: confirm again with the real five files]

### Incident 2: Automated playthrough reported the snake dying with 0 apples

* **Symptom:** Claude's scripted browser test failed at the first redemption with `{'mode': 'dead', 'apples': 0}`.
* **Diagnosis:** not a game bug. The test took a screenshot while the snake was live, and the screenshot took longer than the snake needed to reach the wall.
* **Resolution:** the test now freezes the scene before each screenshot. The full loop then passed: start, reveal, flag, bomb, Snake, escape, return to the same board, both loss paths, win, coin payout and shop purchase.
* **Takeaway:** an AI-written test can be wrong in the same way AI-written code can. The failure had to be read, not just trusted.

### Incident 3: Sounds cannot load when the page is opened straight from disk

* **Symptom:** browsers block Web Audio file loading on `file://` pages, so double-clicking `index.html` would have produced a silent game.
* **Resolution:** `main.js` uses Web Audio whenever the game is served over http(s) (GitHub Pages, Itch.io) and falls back to HTML5 audio only for `file://`. Both paths were tested.

### Incident 4: ElevenLabs music generation failed twice

* **Error:** "Generation failed. There was an unexpected error processing this generation. Please try again." It happened twice in a row in ElevenLabs Chat.
* **Cause:** both attempts used the student's uploaded 2.3 second loop as an audio reference.
* **Recovery:** the third attempt dropped the reference and generated from the text description alone, which worked. Full chain in section 3.4.

### Incident 5: The background loop had a gap

* **Symptom:** the chosen take ended with 0.18 seconds of silence, and MP3 files add a little padding of their own, so a straight loop would stutter every 19 seconds.
* **Resolution:** trimmed to exactly 11 bars (18.857 seconds) and shipped as OGG with an MP3 fallback. See section 3.4.

### Incident 6: [TBD from the student's own playtest]

---

## 5. Human-in-the-Loop Curation & Analytical Reflection

[200 to 300 words, to be written from the student's own notes]

---

## 6. Asset Attribution & Licensing Table

| Asset | Type | Source / Tool | License / Terms |
| :---- | :---- | :---- | :---- |
| redeem.mp3 | SFX | ElevenLabs Sound Effects | Generated by the student on a paid ElevenLabs plan, used under ElevenLabs' terms for paid plans |
| boom.mp3 | SFX | ElevenLabs Sound Effects | Same as above |
| thump.mp3 | SFX | ElevenLabs Sound Effects | Same as above |
| victory.mp3 | SFX | ElevenLabs Sound Effects | Same as above |
| womp.mp3 | SFX | ElevenLabs Sound Effects | Same as above |
| music.ogg, music.mp3 | Background loop | ElevenLabs Chat, Eleven Music v2 (Take 7), trimmed with ffmpeg | Same as above |
| Phaser 3.90.0 | Game framework | phaser.io | MIT License |
| Game code | JavaScript | Written with Claude (Cowork), directed by the student | Student's own work |
| Visuals | Code-drawn shapes | No external image assets | Not applicable |
