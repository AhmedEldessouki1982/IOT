export default function LockIcon({ locked }: { locked: boolean }) {
  return <svg className="lock-icon" data-locked={locked} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <g className="lock-shackle"><path d="M7 11V7a5 5 0 0 1 10 0v4" /></g>
    <rect x="4" y="11" width="16" height="11" rx="2" />
    <path d="M12 15v3" />
  </svg>;
}
