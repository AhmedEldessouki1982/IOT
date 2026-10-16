import { Moon, ShieldCheck, UtensilsCrossed } from "lucide-react";

export interface SceneAction {
  id: string;
  value: boolean;
}

export interface ScenePreset {
  id: string;
  label: string;
  icon: typeof Moon;
  actions: SceneAction[];
}

export const SCENES: ScenePreset[] = [
  {
    id: "evening",
    label: "Evening",
    icon: Moon,
    actions: [
      { id: "light1", value: true },
      { id: "sonoff1", value: true },
      { id: "sonoff2", value: true },
      { id: "sonoff3", value: false },
      { id: "light2", value: true },
      { id: "light_kitchen_undercab", value: true },
      { id: "lock-front-door", value: true },
    ],
  },
  {
    id: "cooking",
    label: "Cooking",
    icon: UtensilsCrossed,
    actions: [
      { id: "light2", value: true },
      { id: "light_kitchen_ceiling_main", value: true },
      { id: "light_kitchen_undercab", value: true },
      { id: "light_kitchen_peninsula_pendant", value: true },
      { id: "appliance_kitchen_oven", value: true },
      { id: "sensor_kitchen_smoke_01", value: false },
    ],
  },
  {
    id: "away",
    label: "Away",
    icon: ShieldCheck,
    actions: [
      { id: "light1", value: false },
      { id: "sonoff1", value: false },
      { id: "sonoff2", value: false },
      { id: "sonoff3", value: false },
      { id: "light2", value: false },
      { id: "toilet-main-g1", value: false },
      { id: "toilet-main-g2", value: false },
      { id: "toilet-main-g3", value: false },
      { id: "light4", value: false },
      { id: "light5", value: false },
      { id: "light6", value: false },
      { id: "light7", value: false },
      { id: "toilet-master-g1", value: false },
      { id: "toilet-master-g2", value: false },
      { id: "toilet-master-g3", value: false },
      { id: "light_kitchen_ceiling_main", value: false },
      { id: "light_kitchen_undercab", value: false },
      { id: "light_kitchen_peninsula_pendant", value: false },
      { id: "appliance_kitchen_oven", value: false },
      { id: "appliance_kitchen_dishwasher", value: false },
      { id: "sensor_kitchen_smoke_01", value: false },
      { id: "lock-front-door", value: true },
    ],
  },
];
