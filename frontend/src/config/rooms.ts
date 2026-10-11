export interface GangConfig {
  id: string;
  gang: number;
  label: string;
}

export interface RoomConfig {
  id: string;
  name: string;
  deviceBase?: string;
  gangs: GangConfig[];
}

export const ROOMS_CONFIG: RoomConfig[] = [
  {
    id: "toilet",
    name: "Main Toilet",
    deviceBase: "sonoff1",
    gangs: [
      { id: "toilet_main_led", gang: 1, label: "Toilet LED Bar" },
      { id: "toilet_main_spots", gang: 2, label: "Toilet Spotlights" },
      { id: "toilet_main_exhaust", gang: 3, label: "Toilet Exhaust Fan" },
    ],
  },
  {
    id: "master",
    name: "Master Suite",
    deviceBase: "sonoff2",
    gangs: [
      { id: "master_led", gang: 1, label: "Master LED Bar" },
      { id: "master_spots", gang: 2, label: "Master Spotlights" },
      { id: "master_exhaust", gang: 3, label: "Master Exhaust Fan" },
    ],
  },
  {
    id: "bed1",
    name: "Bedroom 1",
    gangs: [
      { id: "bed1_led", gang: 1, label: "Bedroom 1 LED" },
      { id: "bed1_spots", gang: 2, label: "Bedroom 1 Spotlights" },
    ],
  },
];
