import type { ScenePreset } from "../dashboard/scenes";
import SceneActionButton from "./SceneActionButton";

interface SceneControlsProps {
  scenes: ScenePreset[];
  onApply: (sceneId: string) => void;
}

export default function SceneControls({ scenes, onApply }: SceneControlsProps) {
  return (
    <div className="scene-controls" aria-label="Scene presets">
      {scenes.map(scene => <SceneActionButton key={scene.id} scene={scene} onApply={onApply} />)}
    </div>
  );
}
