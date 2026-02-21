import { useRef, useCallback } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { NoteInfo } from '../../data/noteData';
import { useEventBus } from '../../hooks/useEventBus';

function toVexFlowKey(note: NoteInfo): string {
  return `${note.name.toLowerCase()}/${note.octave}`;
}

function createStaveNote(notes: NoteInfo[], clef: string): StaveNote {
  const keys = notes.map(toVexFlowKey);
  const staveNote = new StaveNote({ keys, duration: 'w', clef });
  notes.forEach((n, i) => {
    if (n.name.includes('#')) {
      staveNote.addModifier(new Accidental('#'), i);
    }
  });
  return staveNote;
}

export function SheetMusic() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEventBus(
    'selection:changed',
    useCallback((notes: NoteInfo[]) => {
      const el = containerRef.current;
      if (!el) return;

      if (notes.length === 0) {
        el.innerHTML =
          '<p style="color:#999;font-size:0.85rem;text-align:center;padding:20px;">Select notes to see notation</p>';
        return;
      }

      el.innerHTML = '';
      const width = el.clientWidth || 280;
      const renderer = new Renderer(el, Renderer.Backends.SVG);
      renderer.resize(width, 160);
      const context = renderer.getContext();

      const trebleNotes = notes.filter((n) => n.midiNumber >= 60);
      const bassNotes = notes.filter((n) => n.midiNumber < 60);

      let yOffset = 10;

      if (trebleNotes.length > 0) {
        const stave = new Stave(10, yOffset, width - 30);
        stave.addClef('treble');
        stave.setContext(context).draw();

        const vfNote = createStaveNote(trebleNotes, 'treble');
        const voice = new Voice({ numBeats: 1, beatValue: 4 });
        voice.setStrict(false);
        voice.addTickable(vfNote);
        new Formatter().joinVoices([voice]).format([voice], width - 90);
        voice.draw(context, stave);
        yOffset += 80;
      }

      if (bassNotes.length > 0) {
        if (trebleNotes.length > 0) {
          renderer.resize(width, 240);
        }
        const stave = new Stave(10, yOffset, width - 30);
        stave.addClef('bass');
        stave.setContext(context).draw();

        const vfNote = createStaveNote(bassNotes, 'bass');
        const voice = new Voice({ numBeats: 1, beatValue: 4 });
        voice.setStrict(false);
        voice.addTickable(vfNote);
        new Formatter().joinVoices([voice]).format([voice], width - 90);
        voice.draw(context, stave);
      }
    }, []),
  );

  return (
    <div ref={containerRef} className="sheet-music">
      <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
        Select notes to see notation
      </p>
    </div>
  );
}
