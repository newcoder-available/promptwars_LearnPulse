/**
 * PulseLine — the signature element.
 * An ECG trace whose spike amplitude scales with the learner's overall
 * pulse (average mastery): a flat line at 0, a strong heartbeat at 100.
 */
export default function PulseLine({ pulse = 0 }) {
  const amp = 4 + (Math.max(0, Math.min(100, pulse)) / 100) * 22; // 4..26px
  const mid = 30;
  const d = [
    `M0 ${mid}`,
    `H70`,
    `L82 ${mid - amp * 0.4}`,
    `L94 ${mid + amp}`,
    `L106 ${mid - amp}`,
    `L118 ${mid + amp * 0.5}`,
    `L130 ${mid}`,
    `H240`,
    `L252 ${mid - amp * 0.3}`,
    `L264 ${mid + amp * 0.8}`,
    `L276 ${mid - amp * 0.7}`,
    `L288 ${mid}`,
    `H360`,
  ].join(" ");

  return (
    <svg
      className="ecg"
      viewBox="0 0 360 60"
      width="100%"
      height="60"
      role="img"
      aria-label={`Knowledge pulse at ${Math.round(pulse)} percent`}
    >
      <path
        d={d}
        fill="none"
        stroke="var(--pulse)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
