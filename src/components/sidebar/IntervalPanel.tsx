import { useState } from 'react';
import { INTERVALS } from '../../data/intervals';
import { useSpiralBus } from '../../contexts/SpiralContext';

export function IntervalPanel() {
  const bus = useSpiralBus();
  const [value, setValue] = useState('');

  const handleChange = (val: string) => {
    setValue(val);
    if (val === '') {
      bus.emit('interval:select', null);
    } else {
      bus.emit('interval:select', INTERVALS[parseInt(val)]);
    }
  };

  return (
    <div className="plugin-container">
      <label>Interval Highlight</label>
      <select value={value} onChange={(e) => handleChange(e.target.value)}>
        <option value="">&mdash; None &mdash;</option>
        {INTERVALS.map((iv, i) => (
          <option key={i} value={i}>
            {iv.name} ({iv.shortName}) &mdash; {iv.semitones} semitones
          </option>
        ))}
      </select>
    </div>
  );
}
