import { SCENES } from "../dashboard/scenes";

interface ScenesViewProps {
  onApplyScene: (sceneId: string) => void;
}

export default function ScenesView({ onApplyScene }: ScenesViewProps) {
  return (
    <section className="business-panel">
      <div className="panel-headline">
        <span className="panel-kicker">Scenes</span>
        <h2>Repeatable customer moments</h2>
        <p>
          Scenes are the customer-friendly layer over device commands. Each
          preset shows the number of controlled devices and gives immediate
          feedback after it runs.
        </p>
      </div>
      <div className="scene-library">
        {SCENES.map((scene) => {
          const Icon = scene.icon;
          return (
            <article key={scene.id} className="scene-preset-card">
              <span className="scene-preset-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <div>
                <h3>{scene.label}</h3>
                <p>{scene.actions.length} device actions</p>
              </div>
              <button type="button" onClick={() => onApplyScene(scene.id)}>
                Apply
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
