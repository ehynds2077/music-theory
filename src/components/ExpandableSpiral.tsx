import { useState, useCallback } from 'react';
import { MusicSpiral, MusicSpiralProps } from './MusicSpiral';
import { SpiralModal } from './SpiralModal';

type ExpandableSpiralProps = Omit<MusicSpiralProps, 'expandable' | 'onExpand'>;

export function ExpandableSpiral(props: ExpandableSpiralProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleExpand = useCallback(() => setModalOpen(true), []);
  const handleClose = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <MusicSpiral {...props} expandable onExpand={handleExpand} />
      <SpiralModal
        open={modalOpen}
        onClose={handleClose}
        selectedNotes={props.selectedNotes}
        shape={props.shape}
        viewMode={props.viewMode}
      />
    </>
  );
}
