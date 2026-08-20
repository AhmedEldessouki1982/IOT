# IoT Home Control — Stack Architecture

## Overview

Local-first smart home platform. Everything runs on a single Raspberry Pi
inside the customer's home network — no cloud dependency for core
automation. Devices speak MQTT (natively, or via Home Assistant as a
protocol-normalization layer for Zigbee/Z-Wave/Tuya devices that can't
speak MQTT directly).

## Diagram

```mermaid
flowchart TB
    subgraph HOME["🏠 Customer Home — Local WiFi/LAN"]
        subgraph DEVICES["Devices"]
            D1["ESP32 Switch<br/>(Tasmota / custom fw)"]
            D2["ESP32 + DHT22<br/>(temp sensor)"]
            D3["Tuya WiFi Lock<br/>(cloud-native chip)"]
            D4["Zigbee devices<br/>(future)"]
        end

        subgraph PI["Raspberry Pi 4 — Docker Compose"]
            MQTT["Mosquitto<br/>MQTT Broker<br/>:1883"]
            HA["Home Assistant<br/>+ LocalTuya<br/>+ Zigbee2MQTT<br/>(protocol normalizer)"]
            NEST["NestJS Backend<br/>REST + WS Gateway<br/>:3000"]
            PG["PostgreSQL<br/>(users, logs, rules)"]
            FE["React Frontend<br/>(static build)<br/>TUI dashboard"]
        end
    end

    subgraph CLIENT["Client Devices"]
        BROWSER["Browser / Phone<br/>on same LAN"]
    end

    D1 -- "MQTT pub/sub<br/>devices/+/state, devices/+/cmd" --> MQTT
    D2 -- "MQTT pub/sub" --> MQTT
    D3 -- "Tuya local protocol<br/>(local key)" --> HA
    D4 -- "Zigbee radio" --> HA
    HA -- "republishes as MQTT" --> MQTT

    MQTT -- "subscribe devices/+/state" --> NEST
    NEST -- "publish devices/+/cmd" --> MQTT
    NEST --> PG
    NEST -- "REST API" --> FE
    NEST -- "WebSocket<br/>device:state events" --> FE
    FE -- "served by NestJS/nginx" --> BROWSER
    BROWSER -- "HTTP + WS" --> NEST

    style HOME fill:#0a0e0f,stroke:#33ff99,color:#33ff99
    style PI fill:#0f1416,stroke:#33ff99,color:#33ff99
    style DEVICES fill:#0a0e0f,stroke:#ffb000,color:#ffb000
```

## Layer breakdown

| Layer | Technology | Role |
|---|---|---|
| **Device firmware** | ESP32 (Arduino/ESP-IDF), Tasmota | Publishes state, subscribes to commands over MQTT |
| **Protocol bridge** | Home Assistant + Zigbee2MQTT + LocalTuya | Normalizes non-MQTT-native devices (Zigbee, Tuya cloud chips) into MQTT — invisible to the rest of the stack |
| **Message bus** | Mosquitto (MQTT broker) | Single source of truth for device state/commands; every device and service talks through here |
| **Backend** | NestJS (MQTT microservice + REST + WebSocket gateway) | Business logic, device registry, automation/AI decisions, API for the frontend |
| **Persistence** | PostgreSQL | Users, device registry, automation rules, historical logs |
| **Frontend** | React + Vite + TS + Tailwind (TUI/terminal styled) | Customer-facing dashboard — room containers, toggles, sensor readouts |
| **Host** | Raspberry Pi 4, Docker Compose | Single physical box per customer home, all services containerized |

## Data flow (device → user)

1. Device publishes to `devices/<id>/state` on Mosquitto.
2. NestJS's MQTT listener (wildcard `devices/+/state`) picks it up, updates in-memory/DB state.
3. NestJS's WebSocket gateway broadcasts `device:state` to connected browsers.
4. React updates the relevant room container/toggle live, no polling.

## Data flow (user → device)

1. User taps a toggle in React → `POST /devices/:id/command`.
2. NestJS publishes JSON command to `devices/<id>/cmd`.
3. Device (or Home Assistant on its behalf) executes the action, publishes new state back to `devices/<id>/state`.
4. Loop closes via the same WebSocket broadcast path above.

## Local-first principles this stack follows

- No feature depends on internet access — only local LAN + this Pi.
- Any device brand is welcome as long as it either speaks MQTT natively or Home Assistant has an integration for it.
- NestJS never speaks a brand-specific protocol directly — it only ever knows MQTT topics and JSON payloads, keeping the backend clean regardless of what hardware is added later.
