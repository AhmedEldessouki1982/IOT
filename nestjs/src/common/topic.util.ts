export function buildCmndTopic(base: string, gang: number): string {
  return `cmnd/${base}/POWER${gang}`;
}

export function buildStatTopic(base: string, gang?: number): string {
  return gang ? `stat/${base}/POWER${gang}` : `stat/${base}/#`;
}

export function buildAppStateTopic(deviceId: string): string {
  return `devices/${deviceId}/state`;
}

export function buildAppCmdTopic(deviceId: string): string {
  return `devices/${deviceId}/cmd`;
}
