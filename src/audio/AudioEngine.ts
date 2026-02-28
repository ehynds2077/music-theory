import { Piano } from '@tonejs/piano';
import * as Tone from 'tone';
import { NoteInfo } from '../data/noteData';
import { EventBus } from '../utils/eventBus';

export class AudioEngine {
  private piano: Piano;
  private ready = false;
  private contextStarted = false;
  private bus: EventBus;
  private handlers: { event: string; fn: (...args: any[]) => void }[] = [];

  constructor(bus: EventBus) {
    this.bus = bus;
    this.piano = new Piano({ velocities: 5 });
    this.piano.toDestination();

    this.piano.load().then(() => {
      this.ready = true;
      bus.emit('audio:ready');
    });

    // Ensure AudioContext is started on user gesture
    const startContext = async () => {
      if (!this.contextStarted) {
        await Tone.start();
        this.contextStarted = true;
      }
    };
    document.addEventListener('pointerdown', startContext, { once: false });
    document.addEventListener('keydown', startContext, { once: false });

    const onSelect = (note: NoteInfo) => this.playNote(note);
    const onChord = (notes: NoteInfo[]) => this.playChord(notes);
    const onScale = (notes: NoteInfo[]) => this.playScale(notes);
    const onNoteOn = (note: NoteInfo) => this.noteOn(note);
    const onNoteOff = (note: NoteInfo) => this.noteOff(note);

    bus.on('note:select', onSelect);
    bus.on('audio:playChord', onChord);
    bus.on('audio:playScale', onScale);
    bus.on('note:on', onNoteOn);
    bus.on('note:off', onNoteOff);

    this.handlers = [
      { event: 'note:select', fn: onSelect },
      { event: 'audio:playChord', fn: onChord },
      { event: 'audio:playScale', fn: onScale },
      { event: 'note:on', fn: onNoteOn },
      { event: 'note:off', fn: onNoteOff },
    ];
  }

  private toToneName(note: NoteInfo): string {
    // Tone.js uses format like "C4", "F#3"
    return note.fullName;
  }

  async playNote(note: NoteInfo): Promise<void> {
    if (!this.ready) return;
    if (!this.contextStarted) {
      await Tone.start();
      this.contextStarted = true;
    }
    const name = this.toToneName(note);
    this.piano.keyDown({ note: name, velocity: 0.7 });
    setTimeout(() => {
      this.piano.keyUp({ note: name });
    }, 1500);
  }

  async playChord(notes: NoteInfo[]): Promise<void> {
    if (!this.ready || notes.length === 0) return;
    if (!this.contextStarted) {
      await Tone.start();
      this.contextStarted = true;
    }
    for (const note of notes) {
      const name = this.toToneName(note);
      this.piano.keyDown({ note: name, velocity: 0.6 });
    }
    setTimeout(() => {
      for (const note of notes) {
        this.piano.keyUp({ note: this.toToneName(note) });
      }
    }, 2000);
  }

  async noteOn(note: NoteInfo): Promise<void> {
    if (!this.ready) return;
    if (!this.contextStarted) {
      await Tone.start();
      this.contextStarted = true;
    }
    this.piano.keyDown({ note: this.toToneName(note), velocity: 0.7 });
  }

  noteOff(note: NoteInfo): void {
    if (!this.ready) return;
    this.piano.keyUp({ note: this.toToneName(note) });
  }

  async playScale(notes: NoteInfo[]): Promise<void> {
    if (!this.ready || notes.length === 0) return;
    if (!this.contextStarted) {
      await Tone.start();
      this.contextStarted = true;
    }
    const delay = 300; // ms between notes
    for (let i = 0; i < notes.length; i++) {
      const name = this.toToneName(notes[i]);
      setTimeout(() => {
        this.piano.keyDown({ note: name, velocity: 0.7 });
        setTimeout(() => {
          this.piano.keyUp({ note: name });
        }, 500);
      }, i * delay);
    }
  }

  dispose(): void {
    for (const { event, fn } of this.handlers) {
      this.bus.off(event, fn);
    }
    this.handlers = [];
  }
}
