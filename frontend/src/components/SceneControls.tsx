import type { ScenePreset } from "../dashboard/scenes";

interface SceneControlsProps {
  scenes: ScenePreset[];
  onApply: (sceneId: string) => void;
}

export default function SceneControls({ scenes, onApply }: SceneControlsProps) {
  return (
    <span className="scene-controls" aria-label="Scene presets">
      {scenes.map((scene) => {
        const Icon = scene.icon;
        return (
          <button
            key={scene.id}
            type="button"
            className="scene-button"
            onClick={() => onApply(scene.id)}
            title={`Apply ${scene.label} scene`}
          >
            <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
            <span>{scene.label}</span>
          </button>
        );
      })}
    </span>
  );
}
