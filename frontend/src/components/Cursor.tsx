interface CursorProps {
  className?: string;
}

export default function Cursor({ className = "" }: CursorProps) {
  return (
    <span className={`animate-blink inline-block ${className}`} aria-hidden="true">
      ▮
    </span>
  );
}