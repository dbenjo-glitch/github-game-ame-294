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

### 2.6 Difficulty Modes and Snake Speed-Up

#### Exact Prompt Submitted:

> okay, im producing the rest of the sounds. make it so we have an easy, medium, hard, and ultra hard mode. for the hard mode increase the size of the area as well for minesweeper, and for ultra hard increase it even more. as well as make the snake faster corresponding with what difficulty they play with. also make it so the snake speeds up for every 5 second youre in the snake game by 5%

#### Implementation Outcome:

| Mode | Board | Mines | Snake step time |
| :---- | :---- | :---- | :---- |
| Easy | 8x8 | 8 | 150 ms (slow) |
| Medium | 8x8 | 10 | 125 ms (the original game) |
| Hard | 10x10 | 18 | 105 ms |
| Ultra Hard | 12x12 | 30 | 90 ms |

* A difficulty picker was added to the start screen. The choice is saved in the browser.
* The board always fills the same square on screen, so tiles shrink as the board grows (54, 43 and 36 pixels). Numbers, mines, flags and the win-screen snake all scale with the tile.
* In Snake, the step time is divided by 1.05 for every 5 seconds of play. It compounds, and a "SPEED x1.05" readout in the HUD pulses each time it rises. The timer resets on each new redemption.
* All of it is data in `config.js` (`DIFFICULTIES`, `SPEEDUP_EVERY_MS`, `SPEEDUP_FACTOR`), so rebalancing means editing numbers, not code.

#### Decisions the agent made that the student did not specify:

* **Mine counts.** The student asked for bigger boards, not for mine counts. Claude chose densities that rise with difficulty (12.5%, 15.6%, 18% and 20.8% of tiles), close to the classic beginner, intermediate and expert ratios.
* **A speed ceiling.** Compounding 5% forever would make a 30 apple redemption on Ultra Hard physically unplayable, so the step time never drops below 55 ms. This is flagged to the student as a number to tune after playtesting.

#### Verification:

A scripted browser test picked each mode in turn and confirmed the board size, mine count, starting snake speed, the exact 5% step after 5 seconds, the ceiling, a full win on every board size, and that the choice survives a page reload.

---

## 3. Generative Audio & Sound Design Prompts

Prompt template used for every sound (structure drafted with Claude, wording chosen by the student):
`[sound source], [tone or texture], [shape: how it starts and ends], [style or era], no [what to leave out]`

### 3.1 Sound 1: Reward SFX (redemption cleared)

* **Tool:** ElevenLabs Sound Effects (Sound Effects v2)
* **Final file:** `assets/audio/redeem.mp3`
* **Trigger in game:** Snake apple target reached, as the hole opens in the wall and the snake escapes back to Minesweeper.

**Human decision:** Claude's starter draft was a chiptune chime arpeggio with a whoosh. The student wrote his own prompt from scratch, with a rhythmic "bump bump bump" figure and a snake sound to tie the reward to the character. Three rounds, twelve takes, all in the student's exact wording from his ElevenLabs history.

**Round 1** (four takes, 1.0 second each):

> medium speed ascending, trumpet synth, bump bump bump pattern followed by a snake sound, happy, arcade no additional sound

**Round 2** (four takes, 1.8 seconds each). Instrument changed from "trumpet synth" to "jazz synth with reverb", and the duration raised so the pattern and the snake sound both fit:

> medium speed ascending, jazz synth with reverb, bump bump bump pattern followed by a snake sound, happy, arcade no additional sound

**Round 3** (four takes, 1.8 seconds each): the same prompt run again for more options.

* **Chosen:** take #2 from the "jazz synth" prompt, 1.76 seconds.

Post-processing (done by Claude with ffmpeg, no AI generation):

* **Abrupt ending fixed:** the take was still at -6 dB when the file stopped, which would have been heard as a hard cut. A 0.25 second fade-out was added.
* Gain lowered 1.5 dB (the peak was -0.9 dB, with no clipping) so it sits with the other effects, and the WAV was converted to MP3.

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

* **Tool:** ElevenLabs Sound Effects (Sound Effects v2)
* **Final file:** `assets/audio/thump.mp3`
* **Trigger in game:** Snake hits a wall or its own body. `womp.mp3` is chained to play the moment it ends.

This sound took five rounds of four takes each (20 takes). All prompts are the student's exact wording from his ElevenLabs history, oldest first.

How the first prompt was built. Claude supplied the template `Single [weight] [impact word] of [what is hitting] against [surface], [tone], [length], no [exclude]`. The student filled it in and asked about one slot:

> Single medium weight dull bump of snake head against concrete wall with slight reverb, tone, [length], no backround sound
>
> i dont understand the tone part,

* Claude explained tone as the pitch and color of the sound and offered three options. The student replied "low and muffled", then changed it to "medium and sharp" himself before generating.
* Claude warned that "slight reverb" adds a tail, and that a long tail would delay the womp that follows.

**Round 1** (four takes, 2.3 seconds each):

> Single medium weight dull bump of snake head against concrete wall with slight reverb, retro arcade sound, medium and sharp, very short, no background sound

**Round 2** (four takes, 2.3 seconds each). Added an instruction to stop extra noises after the hit:

> Single medium weight dull bump of snake head against concrete wall with slight reverb, retro arcade sound, medium and sharp, very short, no background sound, just 1 sound, no secondary sound

**Round 3** (four takes, 3.0 seconds each). Generated with ElevenLabs' "Similar effects" feature, which wrote its own prompt:

> A soft, dull thudding impact.

**Round 4** (four takes, 0.5 seconds each). Duration set to half a second, weight raised to "heavy", "snake head" simplified to "a head", and "dull" changed to "sharp":

> Single heavy weight sharp bump of a head against concrete wall with slight reverb, retro arcade sound, medium and sharp, very short, no background sound, just 1 sound, no secondary sound

**Round 5** (four takes, 0.5 seconds each). "sharp bump" changed back to "dull bump":

> Single heavy weight dull bump of a head against concrete wall with slight reverb, retro arcade sound, medium and sharp, very short, no background sound, just 1 sound, no secondary sound

* **Chosen:** take #1 of a "Single heavy weight" round, 0.48 seconds. [Student to confirm it is from round 5 and not round 4. The file name is the same for both.]
* **What fixed it:** the first three rounds ran 2.3 to 3 seconds, far too long for a sound that has to finish before the womp. Forcing the duration to 0.5 seconds did more than any wording change.

Post-processing (done by Claude with ffmpeg, no AI generation): none needed beyond format. The take starts instantly, peaks at -4.7 dB with no clipping, and has died away by 0.4 seconds. It was converted from WAV to MP3 with a 0.06 second fade at the very end.

### 3.3 Sound 3: End State SFX (two sounds)

**3a. Victory**

* **Tool:** ElevenLabs Sound Effects (Sound Effects v2)
* **Final file:** `assets/audio/victory.mp3`
* **Trigger in game:** Board cleared. It plays as the win panel pops up with the time taken, while a snake crawls across the board eating the mines.
* **Exact Prompt (the student's own wording, after two typo fixes):**

> Eager final victory, arcade jingle, guitar synth, pattern is dun dun dun dunnnnn, long note on the last dunnnnn, ending on 5 second snake slither sound, no other background noises

The student's first draft, as sent to Claude for review:

> Eager final victory, arcade jingle, Guitar synth, pattern is dun dun dun dunnnnn, long note on the last dunnnnn, ending on 5 secodn snake slither sound. no other backround nosies

* **Human decision:** Claude's starter draft was a chiptune brass fanfare. The student wrote his own around a guitar synth, spelled out the rhythm he wanted, and added a snake slither at the end.
* **Agent input:** Claude changed nothing in the design. It fixed "secodn", "backround" and "nosies" so the model would not misread them, pointed out that the slither matches the mine-eating snake on the win screen, and warned that the duration had to be raised to about 7 seconds or the slither would be cut off (the same mistake as the first game over round).
* **Rounds:** two rounds of four takes, 7.1 seconds each, both with this prompt. **Take #2 chosen.**

Post-processing (done by Claude with ffmpeg, no AI generation):

* The audio ends at 5.35 seconds and the remaining 1.7 seconds was silence, so the file was trimmed to 5.55 seconds with a short fade.
* The peak was at 0.0 dB, so gain was lowered by 2 dB. Converted from WAV to MP3.

**3b. Loss (game over)**

* **Tool:** ElevenLabs Sound Effects (Sound Effects v2)
* **Final file:** `assets/audio/womp.mp3`
* **Trigger in game:** Chained after `thump.mp3` on a Snake crash, and after `boom.mp3` on the fourth bomb.
* **Exact Prompt (the student's own wording):**

> Arcade game over sound, four main descending sad arcade saxophone notes, additional smaller saxophone string of sound at the end that fizzle out, playful loss, no backround sounds

* **Human decision:** Claude's starter draft used a chiptune trombone and a plain four-note "womp". The student rewrote it around a saxophone and added his own idea of a smaller run of notes that fizzles out after the four main ones.
* **Round 1** (four takes, 0.5 seconds each): the duration was still set to half a second from the thump, which is too short to fit four notes.
* **Round 2** (four takes, 2.0 seconds each): same prompt with the duration raised to 2 seconds. **Take #4 chosen.**

Post-processing (done by Claude with ffmpeg, no AI generation):

* **Clipping fix:** the take peaked at 0.0 dB with 184 clipped samples. Gain was lowered by 2 dB, so it now peaks at -2.1 dB.
* The last 0.2 seconds of silence was trimmed so the game over screen is not waiting on dead air, and the WAV was converted to MP3. Final length 1.9 seconds.

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
* **Resolution so far:** with the music file added and placeholder tones standing in for the five effects, a scripted playthrough showed zero console errors and every trigger firing in the right order: boom on a bomb, redeem on escape, thump then womp on a Snake crash, boom then womp on the fourth bomb, victory on a win. All five real effect files are now in the repo.

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

### Incident 6: Pushes to GitHub failed silently, and the live game was blank

* **Symptom:** the commit history was missing four commits that Claude believed it had made, including the one with all five scene files. The GitHub Pages link served a page that could not start.
* **Cause:** Claude was committing through the GitHub web upload page. A commit message longer than 50 characters makes GitHub show a tip banner that pushes the Commit button down the page, so the click landed on empty space. Nothing reported an error.
* **How it was caught:** by reading the commit list after a push instead of assuming it worked.
* **Resolution:** every file was pushed again with short commit messages, and each push is now confirmed against the repo before moving on. The live site was then loaded and checked directly.
* **Takeaway:** an agent reporting "done" is not evidence. The check has to be against the real system.

### Incident 7: Another failure that was the test's fault

* **Symptom:** after the difficulty change, the touch-control test reported `swipe failed ['dead', ...]`.
* **Diagnosis:** the test slowed the snake by setting a config value that the difficulty change had just removed, so the snake ran at full speed and hit the wall before the test could swipe. The game was fine.
* **Resolution:** the test was updated to slow the snake through the new difficulty settings. All tests passed.

### Incident 8: [TBD from the student's own playtest]

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
