import { LessonLayout } from './LessonLayout';
import { SpiralIllustration } from '../../components/SpiralIllustration';

// C4 = MIDI 60
const C4 = 60;

const INTERVALS = [
  { name: 'Minor 2nd', shortName: 'm2', semitones: 1, example: 'C - C#', description: 'The smallest interval in Western music. It creates a tense, dissonant sound. Think of the "Jaws" theme.' },
  { name: 'Major 2nd', shortName: 'M2', semitones: 2, example: 'C - D', description: 'A whole step. This is the interval between most adjacent white keys. It sounds open and is the basis of major and minor scales.' },
  { name: 'Minor 3rd', shortName: 'm3', semitones: 3, example: 'C - Eb', description: 'The defining interval of minor chords and keys. It carries a darker, more melancholic quality.' },
  { name: 'Major 3rd', shortName: 'M3', semitones: 4, example: 'C - E', description: 'The defining interval of major chords. It sounds bright and happy. Together with the perfect 5th, it forms a major triad.' },
  { name: 'Perfect 4th', shortName: 'P4', semitones: 5, example: 'C - F', description: 'A strong, stable interval. Think of the first two notes of "Here Comes the Bride." It\'s the inversion of the perfect 5th.' },
  { name: 'Tritone', shortName: 'TT', semitones: 6, example: 'C - F#', description: 'Exactly half an octave. Historically called the "devil\'s interval" for its restless, unstable sound. It\'s the most dissonant interval and creates strong tension that wants to resolve.' },
  { name: 'Perfect 5th', shortName: 'P5', semitones: 7, example: 'C - G', description: 'The most consonant interval after the octave. It sounds powerful and open. Power chords in rock music are just root + fifth.' },
  { name: 'Minor 6th', shortName: 'm6', semitones: 8, example: 'C - Ab', description: 'An interval with a bittersweet quality. It\'s the inversion of the major 3rd.' },
  { name: 'Major 6th', shortName: 'M6', semitones: 9, example: 'C - A', description: 'A warm, consonant interval. Think of the first two notes of "My Bonnie Lies Over the Ocean." It\'s the inversion of the minor 3rd.' },
  { name: 'Minor 7th', shortName: 'm7', semitones: 10, example: 'C - Bb', description: 'A mildly dissonant interval that\'s essential to dominant 7th chords and the blues. It creates a sense of wanting to resolve.' },
  { name: 'Major 7th', shortName: 'M7', semitones: 11, example: 'C - B', description: 'A very dissonant interval just one half step short of the octave. It gives major 7th chords their dreamy, jazz quality.' },
  { name: 'Octave', shortName: 'P8', semitones: 12, example: 'C4 - C5', description: 'The same note at a higher pitch. Notes an octave apart sound so similar that we give them the same letter name. On the spiral, octaves stack directly above one another.' },
];

export function IntervalsLesson() {
  return (
    <LessonLayout title="Understanding Intervals">
      <p>
        An <strong>interval</strong> is the distance between two notes, measured in
        semitones (half steps). Intervals are the building blocks of melody and harmony &mdash;
        every chord, scale, and melody is made up of intervals.
      </p>
      <p>
        On the chromatic spiral, intervals have a beautiful geometric meaning: each
        interval corresponds to a specific angle of rotation around the helix. Notes that
        are close together on the spiral are close in pitch.
      </p>

      <h2>The 12 Intervals</h2>
      <p>
        Within one octave, there are 12 possible intervals (not counting unison). Each one
        has a distinct sound character, from highly dissonant to perfectly consonant.
      </p>

      {INTERVALS.map((interval) => (
        <div key={interval.shortName}>
          <h3>
            {interval.name} ({interval.shortName}) &mdash; {interval.semitones}{' '}
            {interval.semitones === 1 ? 'semitone' : 'semitones'}
          </h3>
          <p>{interval.description}</p>
          <SpiralIllustration
            caption={`${interval.name}: ${interval.example}`}
            selectedNotes={[C4, C4 + interval.semitones]}
          />
        </div>
      ))}

      <h2>How Intervals Build Chords</h2>
      <p>
        Chords are created by stacking intervals on top of each other. The most common
        approach is stacking thirds:
      </p>
      <p>
        A <strong>major triad</strong> is built from a major 3rd (4 semitones) plus a
        minor 3rd (3 semitones) on top: for example, C &ndash; E &ndash; G.
      </p>
      <SpiralIllustration
        caption="C Major triad: C - E - G (major 3rd + minor 3rd)"
        selectedNotes={[C4, C4 + 4, C4 + 7]}
      />
      <p>
        A <strong>minor triad</strong> reverses the order: minor 3rd (3 semitones) then
        major 3rd (4 semitones). For example, C &ndash; Eb &ndash; G.
      </p>
      <SpiralIllustration
        caption="C Minor triad: C - Eb - G (minor 3rd + major 3rd)"
        selectedNotes={[C4, C4 + 3, C4 + 7]}
      />
      <p>
        Adding another third on top gives us <strong>seventh chords</strong>. A dominant
        7th chord adds a minor 3rd on top of a major triad: C &ndash; E &ndash; G &ndash; Bb.
      </p>
      <SpiralIllustration
        caption="C Dominant 7th: C - E - G - Bb"
        selectedNotes={[C4, C4 + 4, C4 + 7, C4 + 10]}
      />
      <p>
        Try expanding any of these spirals to explore the intervals interactively with
        full controls and audio!
      </p>
    </LessonLayout>
  );
}
