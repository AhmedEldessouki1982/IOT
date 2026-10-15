import type { ReadinessSummary } from "../hooks/useDeviceRecords";

interface KpiRailProps {
  readiness: ReadinessSummary;
  online: boolean;
}

export default function KpiRail({ readiness, online }: KpiRailProps) {
  return (
    <section className="kpi-rail" aria-label="Framework readiness summary">
      <article
        className="kpi-card"
        data-tone={readiness.score > 85 ? "good" : "warn"}
      >
        <span>Devices ready</span>
        <strong>{readiness.score}%</strong>
        <small>{readiness.attention} live devices need attention</small>
      </article>
      <article className="kpi-card">
        <span>Registry</span>
        <strong>{readiness.total}</strong>
        <small>
          {readiness.live} live, {readiness.demo} demo
        </small>
      </article>
      <article className="kpi-card" data-tone={online ? "good" : "danger"}>
        <span>Hub</span>
        <strong>{online ? "Live" : "Offline"}</strong>
        <small>
          {readiness.onlineLive}/{readiness.live} live reporting
        </small>
      </article>
    </section>
  );
}
