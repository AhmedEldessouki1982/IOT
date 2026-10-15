import { SCENES } from "../dashboard/scenes";

interface ScenesViewProps {
  onApplyScene: (sceneId: string) => void;
}

export default function ScenesView({ onApplyScene }: ScenesViewProps) {
  return (
    <section className="business-panel">
      <div className="panel-headline">
        <h2>Scenes</h2>
        <p>Set the home for common moments with one action.</p>
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
                <p>Changes {scene.actions.length} devices</p>
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
