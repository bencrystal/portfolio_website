-- Practice skill tree: curriculum seed (5 branches x 4 tiers x 3 nodes).
-- Run manually in Supabase. Safe order:
--   1. the ALTER (adds ref_url used by the app after this deploy)
--   2. optionally clear old shared nodes nobody has started
--   3. the INSERT
-- Nodes with progress rows are never touched.

alter table practice_tree_nodes add column if not exists ref_url text;

-- Optional: remove previously seeded shared nodes that no one has started,
-- so the new curriculum replaces them instead of stacking underneath.
delete from practice_tree_nodes
where space_id is null
  and id not in (select node_id from practice_tree_progress);

insert into practice_tree_nodes (branch, position, tier, name, description, gate_type, gate_value, ref_url) values

-- ───────────────────────── Picking ─────────────────────────
-- Tier 1 · Fundamentals
('picking', 1, 1, 'Spider walk 1-2-3-4',
 'One finger per fret across four frets, every string, strict down-up picking. Keep fingers hovering close to the fretboard and let the metronome decide the speed — clean and even beats fast. Eighth notes; gate is the click speed.',
 'bpm', 80, 'https://appliedguitartheory.com/lessons/spider-exercises/'),
('picking', 2, 1, 'Open-string alternate picking',
 'Down-up on each open string, four picks per string, then move to the next. All the attention goes to the picking hand: small motion from the wrist, same volume on down and up strokes.',
 'bpm', 100, 'https://www.fachords.com/blog2018/alternate-picking-exercises/'),
('picking', 3, 1, 'String-crossing pairs',
 'Alternate-pick two adjacent strings (E-A, A-D, ...) in eighth notes, always down on the lower string and up on the higher, then reversed. Crossing strings without stumbling is the whole skill here.',
 'bpm', 90, 'https://www.fachords.com/blog2018/alternate-picking-exercises/'),
-- Tier 2 · Development
('picking', 4, 2, 'Major scale, two octaves',
 'One scale shape, alternate picked, ascending and descending without pausing at the turnaround. Say the note names as you go and it doubles as fretboard work. Eighth notes at the gate tempo.',
 'bpm', 100, 'https://www.justinguitar.com/guitar-lessons/intermediate-practice-routine-pc-502'),
('picking', 5, 2, 'String-skipping spider',
 'The 1-2-3-4 spider but jumping a string each time (E to D, A to G, ...). Forces the picking hand to travel accurately instead of leaning on the next string over.',
 'bpm', 90, 'https://fretboardia.com/chromatic-exercises/'),
('picking', 6, 2, 'Pentatonic in sixteenths',
 'Minor pentatonic box, four notes per beat, strict alternate picking. Start well under the gate and add 5 bpm only when a full pass is flawless.',
 'bpm', 80, 'https://guitarwiz.app/articles/chromatic-exercises-guitar/'),
-- Tier 3 · Fluency
('picking', 7, 3, 'Economy picking basics',
 'When crossing to a higher string after a downstroke, keep moving down through it (and mirror on the way up). Run a three-note-per-string scale slowly and let the pick fall through the strings.',
 'bpm', 100, 'https://en.wikipedia.org/wiki/Economy_picking'),
('picking', 8, 3, 'Three-note-per-string runs',
 'Full three-note-per-string major scale across all six strings, alternate picked in triplets. The awkward string changes are the exercise; isolate any transition that flams.',
 'bpm', 110, 'https://www.fretboardanatomy.com/wp-content/uploads/Intermediate-To-Advanced-Roadmap%E2%80%94FretboardAnatomy.com_.pdf'),
('picking', 9, 3, 'The crooked spider',
 'A spider walk that changes picking direction mid-pattern so you can never settle into autopilot. Great daily tester — if this is clean, everything below it is clean.',
 'bpm', 100, 'https://www.fachords.com/daily-guitar-exercise/'),
-- Tier 4 · Mastery
('picking', 10, 4, 'Swept triad arpeggios',
 'Three-string major and minor triad shapes, one continuous pick stroke per direction, one note sounding at a time. Mute behind the sweep with both hands; blur means slow down.',
 'bpm', 90, 'https://en.wikipedia.org/wiki/Sweep_picking'),
('picking', 11, 4, 'Sixteenths at speed',
 'Any scale run of your choice in sixteenths, alternate picked, recorded and listened back for evenness. The gate is a clean, relaxed 140 — tension that only survives ten seconds does not count.',
 'bpm', 140, 'https://www.fachords.com/blog2018/alternate-picking-exercises/'),
('picking', 12, 4, 'Picking étude',
 'Learn one demanding picking piece end to end (Paul Gilbert lick, a Bach line, a bluegrass fiddle tune — your call). Evolve it when you can play it for someone without a warning label.',
 'self', null, 'https://www.tonebase.co/guitar-blog-posts/how-to-structure-a-guitar-lesson'),

-- ─────────────────────── Fingerpicking ───────────────────────
-- Tier 1 · Fundamentals
('fingerpicking', 1, 1, 'PIMA home position',
 'Thumb (P) covers E-A-D, index (I) the G, middle (M) the B, ring (A) the high E. Plant the hand, pluck each string in turn, and keep every finger on its own string. Ten focused minutes a day beats an hour of guessing.',
 'time', 3600, 'https://hubguitar.com/technique/144-fingerstyle-exercises'),
('fingerpicking', 2, 1, 'P-I-M-A rolls on open chords',
 'Hold C and G shapes and roll P-I-M-A, then P-A-M-I, one note per click. Even volume across fingers is the goal — the thumb will bully the others at first.',
 'bpm', 60, 'https://strumavenue.com/acoustic-guitar-fingerpicking-patterns-for-beginners/'),
('fingerpicking', 3, 1, 'Steady thumb',
 'Thumb plays quarter-note bass on the beat while the fingers stay silent, through a full chord progression. Boring on purpose: the independent thumb is the foundation of everything upstream.',
 'time', 3600, 'https://learnfingerpicking.com/wp-content/uploads/2018/12/Learn-Fingerpicking.pdf'),
-- Tier 2 · Development
('fingerpicking', 4, 2, 'Travis picking core pattern',
 'P-I-P-M with the thumb alternating between two bass strings: bass on 1 and 3, fingers filling the off-beats. Start on one chord until the thumb runs itself, then add the C-Am-F-G loop.',
 'bpm', 70, 'https://www.fender.com/articles/techniques/travis-picking-on-guitar'),
('fingerpicking', 5, 2, 'Alternating bass through changes',
 'Keep the alternating thumb going while changing chords every bar. The thumb must not hiccup at the change — slow the click until it doesn''t.',
 'bpm', 80, 'https://www.musicradar.com/how-to/guitar-lesson-how-to-start-travis-picking-your-chords'),
('fingerpicking', 6, 2, 'Six-string arpeggio patterns',
 'Longer rolls (P-I-M-A-M-I and friends) across all six strings over a progression. Pick two patterns from the reference list and live with them for a week each.',
 'bpm', 70, 'https://www.blitzguitar.com/23-epic-fingerpicking-patterns-and-how-to-actually-use-them/'),
-- Tier 3 · Fluency
('fingerpicking', 7, 3, 'Palm-muted bass + melody',
 'Rest the picking-hand palm lightly on the bass strings so the thumb thumps while melody notes ring on top — the classic fingerstyle texture. Then syncopate the melody against the steady bass.',
 'bpm', 90, 'https://www.soundguitarlessons.com/blog/level-up-your-travis-picking-with-these-fingerpicking-guitar-exercises'),
('fingerpicking', 8, 3, 'Walking bass between chords',
 'Connect chords with scalar bass runs under a picking pattern, keeping the fingers'' part undisturbed. Start with the last two beats before each change.',
 'bpm', 80, 'https://www.soundguitarlessons.com/blog/level-up-your-travis-picking-with-these-fingerpicking-guitar-exercises'),
('fingerpicking', 9, 3, 'First fingerstyle piece',
 'Learn one full fingerstyle song (Dust in the Wind, Blackbird, Landslide tier). Evolve when you can play it top to bottom at tempo, twice in a row.',
 'self', null, 'https://acousticguitar.com/lesson-learn-the-nuts-and-bolts-of-travis-picking/'),
-- Tier 4 · Mastery
('fingerpicking', 10, 4, 'Speed rolls',
 'Tremolo-adjacent P-A-M-I rolls in sixteenths, even as a drum machine. Competitive fingerstyle lives at 120+; get there without the hand locking up.',
 'bpm', 120, 'https://hubguitar.com/technique/144-fingerstyle-exercises'),
('fingerpicking', 11, 4, 'Full Travis arrangement',
 'A complete Travis-picked arrangement with melody, alternating bass, and fills at once (Chet Atkins / Tommy Emmanuel repertoire). This is the branch boss.',
 'self', null, 'https://academy.sixstringfingerpicking.com/courses/total-travis-picking'),
('fingerpicking', 12, 4, 'Percussive fingerstyle',
 'Add slap, golpe, and muted hits to an arrangement of your own. Taste over quantity — the groove must survive the percussion.',
 'self', null, 'https://www.blitzguitar.com/23-epic-fingerpicking-patterns-and-how-to-actually-use-them/'),

-- ─────────────────────── Rhythm & time ───────────────────────
-- Tier 1 · Fundamentals
('rhythm', 1, 1, 'Quarters and eighths on the click',
 'Strum one chord: four bars of quarter notes, four bars of eighths, without drifting off the metronome. Record 30 seconds and listen — the tape never flatters.',
 'bpm', 80, 'https://www.justinguitar.com/guitar-lessons/intermediate-practice-routine-pc-502'),
('rhythm', 2, 1, 'Count subdivisions out loud',
 'Say "1 e & a 2 e & a" while strumming simple patterns. Feeling where the "e" and "a" live is what separates tight from almost-tight.',
 'time', 3600, 'https://www.musical-u.com/learn/topic/instruments/guitar/'),
('rhythm', 3, 1, 'Constant strumming hand',
 'Keep the strumming arm moving in eighths and create patterns only by missing the strings. The arm becomes the clock; patterns become free.',
 'bpm', 90, 'https://www.theguitarlesson.com/guitar-practice-schedule/'),
-- Tier 2 · Development
('rhythm', 4, 2, 'Sixteenth-note patterns',
 'Sixteenth strumming with accents (down-up throughout, accent the beat, then accent the off-beat). Slow click, small motion.',
 'bpm', 70, 'https://guitargearfinder.com/guides/guitar-practice-routine/'),
('rhythm', 5, 2, 'Dynamics and accents',
 'Same pattern, four volume levels: whisper, speak, project, shout. Then accent beats 2 and 4 only. Control of loudness is control of groove.',
 'bpm', 80, 'https://www.tonebase.co/guitar-blog-posts/how-to-structure-a-guitar-lesson'),
('rhythm', 6, 2, 'Play with a drone',
 'Put a drone or backing loop on and lock a strum or riff into it for a full track length without the metronome''s hand-holding.',
 'self', null, 'https://www.musical-u.com/learn/topic/instruments/guitar/'),
-- Tier 3 · Fluency
('rhythm', 7, 3, 'Syncopation and ties',
 'Patterns that tie across the beat so the downbeat is felt but not struck. Count out loud; when you stop needing to, evolve it.',
 'bpm', 90, 'https://www.musical-u.com/learn/topic/instruments/guitar/'),
('rhythm', 8, 3, 'Shuffle and triplets',
 'Swing eighths and full triplet strums over a blues loop. Switching between straight and swung feel on command is the gate you self-check at the click.',
 'bpm', 90, 'https://www.guitartricks.com/experienced'),
('rhythm', 9, 3, 'Sixteenth-note funk scratch',
 'Muted "chucka" sixteenths with chord stabs popping out of the mute. The left hand releases pressure without leaving the strings.',
 'bpm', 80, 'https://www.guitartricks.com/experienced'),
-- Tier 4 · Mastery
('rhythm', 10, 4, 'Click on 2 and 4',
 'Halve the metronome and hear it as the backbeat (snare), not the downbeat. Then halve again — one click per bar. The tempo lives in you, the click just audits.',
 'bpm', 60, 'https://www.tonebase.co/guitar-blog-posts/how-to-structure-a-guitar-lesson'),
('rhythm', 11, 4, 'Odd meters',
 'Riffs in 5/4 and 7/8 until they stop feeling like counting and start feeling like grooves. Steal from Tool, Dave Brubeck, or Balkan folk.',
 'self', null, 'https://www.guitartricks.com/experienced'),
('rhythm', 12, 4, 'Tempo push and pull',
 'Practice deliberately playing on top of, dead on, and behind the beat over a loop — and hearing the difference. Feel is a choice once time is solid.',
 'self', null, 'https://www.tonebase.co/guitar-blog-posts/how-to-structure-a-guitar-lesson'),

-- ─────────────── Theory, fretboard & ears ───────────────
-- Tier 1 · Fundamentals
('theory', 1, 1, 'Note names: E and A strings',
 'Use the random-note tool: for each note called, find it on the low E and A strings before the next one lands. These two strings unlock every barre chord root.',
 'time', 3600, 'https://www.justinguitar.com/guitar-lessons/note-circle-b1-405'),
('theory', 2, 1, 'Intervals on one string',
 'Play major scale intervals up a single string and say them (root, 2nd, 3rd...). Seeing intervals as fret distances makes the whole fretboard one shape.',
 'self', null, 'https://www.fachords.com/guitar-ear-training-intro/'),
('theory', 3, 1, 'Build the major scale',
 'Whole-whole-half-whole-whole-whole-half. Spell C, G, D, and F major out loud away from the guitar, then find each on two string sets.',
 'self', null, 'https://www.justinguitar.com/guitar-lessons/note-circle-b1-405'),
-- Tier 2 · Development
('theory', 4, 2, 'Note names: all six strings',
 'Random-note tool with the metronome on: name and fret the called note on every string, one string per beat at a slow click. Gate is the click you can do it at.',
 'bpm', 60, 'https://www.justinguitar.com/guitar-lessons/note-circle-b1-405'),
('theory', 5, 2, 'Interval ear training',
 'Daily interval recognition drills (start with ascending 3rds, 5ths, octaves; add the rest weekly). Sing the interval back before answering — the voice is the ear''s proof.',
 'time', 3600, 'https://tonedear.com/'),
('theory', 6, 2, 'Spell every triad',
 'Major, minor, diminished, augmented: spell them from any root, then grab each on strings 1-3 and 2-4. Triads are the fretboard''s vocabulary words.',
 'self', null, 'https://tonesavvy.com/music-practice-exercises/'),
-- Tier 3 · Fluency
('theory', 7, 3, 'Triads across the neck',
 'All inversions of major and minor triads on every three-string set, moved through a song''s progression. This is where rhythm playing gets melodic.',
 'self', null, 'https://www.fretboardanatomy.com/wp-content/uploads/Intermediate-To-Advanced-Roadmap%E2%80%94FretboardAnatomy.com_.pdf'),
('theory', 8, 3, 'Chord quality by ear',
 'Recognition drills for major, minor, diminished, and 7th chord qualities. When you hear a song, guess the quality before you grab the guitar.',
 'time', 3600, 'https://tonedear.com/'),
('theory', 9, 3, 'Keys and the circle of fifths',
 'Learn key signatures around the circle and practice naming the diatonic chords of any major key on the spot (ii and V first — they run everything).',
 'self', null, 'https://tonesavvy.com/music-practice-exercises/'),
-- Tier 4 · Mastery
('theory', 10, 4, 'Progressions by ear',
 'Hear I-IV-V, I-V-vi-IV, ii-V-I and friends and name the numerals in real songs. The radio becomes flash cards.',
 'time', 7200, 'https://www.tonegym.co/exercise/index'),
('theory', 11, 4, 'Modes as sounds',
 'Dorian, Mixolydian, Lydian — learn each as a sound over a drone (there''s one in the hero), not as a fingering. If you can''t sing its color note, you don''t have it yet.',
 'self', null, 'https://www.emusic.tools/en/tools/ear-training'),
('theory', 12, 4, 'Transcribe a melody',
 'Lift a full melody or solo off a recording by ear, no tabs, and write it down or play it back verbatim. The graduation exercise for the whole branch.',
 'self', null, 'https://moises.ai/blog/tips/guitar-ear-training/'),

-- ───────────────────────── Repertoire ─────────────────────────
-- Tier 1 · Fundamentals
('repertoire', 1, 1, 'First complete song',
 'One song, start to finish, mistakes allowed but no stopping. Momentum over perfection — restarting is the habit to break first.',
 'self', null, 'https://www.justinguitar.com/categories/beginner-song-lessons'),
('repertoire', 2, 1, 'Three-song set',
 'Three songs you can play back to back from memory. Write the set on paper; if you need the paper for the chords, it doesn''t count yet.',
 'self', null, 'https://www.justinguitar.com/categories/beginner-song-lessons'),
('repertoire', 3, 1, 'Play along with the record',
 'Play your songs against the original recordings at full tempo. The band doesn''t wait for you, which is exactly the point.',
 'self', null, 'https://www.theguitarlesson.com/guitar-practice-schedule/'),
-- Tier 2 · Development
('repertoire', 4, 2, 'A song with barre chords',
 'Pick a song that forces F and B minor and play it cleanly all the way through. The song gives the barre practice a deadline.',
 'self', null, 'https://www.justinguitar.com/categories/beginner-song-lessons'),
('repertoire', 5, 2, 'Five songs from memory',
 'Grow the set to five, mixed feels (one slow, one fast, one fingerpicked if you can). Run the whole set twice a week so old songs don''t rot.',
 'self', null, 'https://guitargearfinder.com/guides/guitar-practice-routine/'),
('repertoire', 6, 2, 'Play for one person',
 'Perform two songs for a friend, in person or on a call. Ears in the room change everything; do it early and often.',
 'self', null, 'https://www.tonebase.co/guitar-blog-posts/how-to-structure-a-guitar-lesson'),
-- Tier 3 · Fluency
('repertoire', 7, 3, 'A fingerstyle arrangement',
 'Learn a full fingerstyle arrangement where the guitar carries melody and accompaniment alone. Borrow from the fingerpicking branch — the trees cross here.',
 'self', null, 'https://acousticguitar.com/lesson-learn-the-nuts-and-bolts-of-travis-picking/'),
('repertoire', 8, 3, 'Ten-song setlist',
 'Ten songs, ordered like a real set with an opener and a closer. This is a working musician''s minimum viable catalog.',
 'self', null, 'https://guitargearfinder.com/guides/guitar-practice-routine/'),
('repertoire', 9, 3, 'Improvise over a backing track',
 'Solo over a 12-bar blues and a pop loop using the pentatonic and your triads. Phrases, not scales: say something, breathe, say something else.',
 'self', null, 'https://www.guitartricks.com/experienced'),
-- Tier 4 · Mastery
('repertoire', 10, 4, 'Thirty-minute set',
 'Play a continuous half-hour set for people — living room, open mic, park. Talking between songs counts as part of the instrument.',
 'self', null, 'https://www.tonebase.co/guitar-blog-posts/how-to-structure-a-guitar-lesson'),
('repertoire', 11, 4, 'Learn a song entirely by ear',
 'No tabs, no video, just the recording: chords, form, and hooks lifted by ear. Pairs with the transcription node across the aisle.',
 'self', null, 'https://moises.ai/blog/tips/guitar-ear-training/'),
('repertoire', 12, 4, 'Arrange or write your own',
 'Write a song or build your own arrangement of someone else''s, and play it for an audience. The tree ends where your voice begins.',
 'self', null, 'https://www.tonebase.co/guitar-blog-posts/how-to-structure-a-guitar-lesson');
