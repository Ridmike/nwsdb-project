import './LoadingScreen.css';

export function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="nwsdb-loading-screen" role="status" aria-live="polite">
      <span className="nwsdb-loading-screen__spinner" aria-hidden="true" />
      <span className="nwsdb-loading-screen__label">{label}</span>
    </div>
  );
}

export default LoadingScreen;
