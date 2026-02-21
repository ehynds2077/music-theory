export function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <div className={`loading-overlay${visible ? '' : ' hidden'}`}>
      <div className="spinner" />
      <p>Loading piano samples...</p>
    </div>
  );
}
