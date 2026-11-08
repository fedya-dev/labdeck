import type { DashboardConfig } from './types';

/**
 * Default seed configuration — a typical home-lab setup.
 * Used the first time the app runs (data/dashboard.json is created from it)
 * and whenever the config file is missing or corrupted.
 */

export function makeId(prefix: string): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${rnd}`;
}

export const defaultConfig: DashboardConfig = {
  version: 1,
  title: { bg: 'LabDeck', en: 'LabDeck' },
  subtitle: {
    bg: 'Домашна лаборатория · всички услуги на едно място',
    en: 'Home lab · every service in one place',
  },
  hero: { show: true, showClock: true },
  links: { github: '', website: '' },
  sections: [
    {
      id: 'sec-infrastructure',
      icon: '🖥️',
      name: { bg: 'Инфраструктура', en: 'Infrastructure' },
      services: [
        {
          id: 'svc-proxmox',
          name: { bg: 'Proxmox VE', en: 'Proxmox VE' },
          description: {
            bg: 'Хипервайзор за виртуални машини и LXC контейнери',
            en: 'Hypervisor for VMs and LXC containers',
          },
          url: 'https://192.168.1.10:8006',
          icon: '',
        },
        {
          id: 'svc-portainer',
          name: { bg: 'Portainer', en: 'Portainer' },
          description: {
            bg: 'Управление на Docker контейнерите',
            en: 'Docker container management',
          },
          url: 'http://192.168.1.10:9000',
          icon: '',
        },
        {
          id: 'svc-nas',
          name: { bg: 'NAS хранилище', en: 'NAS Storage' },
          description: {
            bg: 'TrueNAS — файлово хранилище и резервни копия',
            en: 'TrueNAS — file storage and backups',
          },
          url: 'http://192.168.1.20',
          icon: '',
        },
      ],
    },
    {
      id: 'sec-network',
      icon: '🛡️',
      name: { bg: 'Мрежа и защита', en: 'Network & Security' },
      services: [
        {
          id: 'svc-pihole',
          name: { bg: 'Pi-hole', en: 'Pi-hole' },
          description: {
            bg: 'Мрежов DNS филтър срещу реклами и тракери',
            en: 'Network-wide DNS ad and tracker blocking',
          },
          url: 'http://192.168.1.10/admin',
          icon: '',
        },
        {
          id: 'svc-npm',
          name: { bg: 'Proxy Manager', en: 'Proxy Manager' },
          description: {
            bg: 'Nginx Proxy Manager — реверс прокси и SSL',
            en: 'Nginx Proxy Manager — reverse proxy and SSL',
          },
          url: 'http://192.168.1.10:81',
          icon: '',
        },
        {
          id: 'svc-wg',
          name: { bg: 'WireGuard VPN', en: 'WireGuard VPN' },
          description: {
            bg: 'wg-easy — достъп от разстояние до мрежата',
            en: 'wg-easy — remote access to the LAN',
          },
          url: 'http://192.168.1.10:51821',
          icon: '',
        },
      ],
    },
    {
      id: 'sec-media',
      icon: '🎬',
      name: { bg: 'Мултимедия', en: 'Media' },
      services: [
        {
          id: 'svc-jellyfin',
          name: { bg: 'Jellyfin', en: 'Jellyfin' },
          description: {
            bg: 'Филми, сериали и музика — лично Netflix',
            en: 'Movies, shows and music — your own Netflix',
          },
          url: 'http://192.168.1.30:8096',
          icon: '',
        },
        {
          id: 'svc-navidrome',
          name: { bg: 'Navidrome', en: 'Navidrome' },
          description: {
            bg: 'Личен музикален стрийминг сървър',
            en: 'Personal music streaming server',
          },
          url: 'http://192.168.1.30:4533',
          icon: '',
        },
        {
          id: 'svc-qbittorrent',
          name: { bg: 'qBittorrent', en: 'qBittorrent' },
          description: {
            bg: 'Торент клиент с уеб интерфейс',
            en: 'Torrent client with a web interface',
          },
          url: 'http://192.168.1.30:8080',
          icon: '',
        },
      ],
    },
    {
      id: 'sec-smarthome',
      icon: '🏠',
      name: { bg: 'Дом и автоматизация', en: 'Home & Automation' },
      services: [
        {
          id: 'svc-hass',
          name: { bg: 'Home Assistant', en: 'Home Assistant' },
          description: {
            bg: 'Умният дом — автоматизации и интеграции',
            en: 'Smart home — automations and integrations',
          },
          url: 'http://192.168.1.40:8123',
          icon: '',
        },
        {
          id: 'svc-nodered',
          name: { bg: 'Node-RED', en: 'Node-RED' },
          description: {
            bg: 'Визуални потоци за автоматизация',
            en: 'Visual flows for automation',
          },
          url: 'http://192.168.1.40:1880',
          icon: '',
        },
        {
          id: 'svc-zigbee',
          name: { bg: 'Zigbee2MQTT', en: 'Zigbee2MQTT' },
          description: {
            bg: 'Управление на Zigbee сензорите и крушките',
            en: 'Manage Zigbee sensors and bulbs',
          },
          url: 'http://192.168.1.40:8080',
          icon: '',
        },
      ],
    },
    {
      id: 'sec-monitoring',
      icon: '📈',
      name: { bg: 'Мониторинг', en: 'Monitoring' },
      services: [
        {
          id: 'svc-grafana',
          name: { bg: 'Grafana', en: 'Grafana' },
          description: {
            bg: 'Дашборди и графики за метриките',
            en: 'Dashboards and graphs for your metrics',
          },
          url: 'http://192.168.1.10:3001',
          icon: '',
        },
        {
          id: 'svc-uptime',
          name: { bg: 'Uptime Kuma', en: 'Uptime Kuma' },
          description: {
            bg: 'Наблюдение дали услугите са живи',
            en: 'Keeps an eye on service uptime',
          },
          url: 'http://192.168.1.10:3002',
          icon: '',
        },
        {
          id: 'svc-netdata',
          name: { bg: 'Netdata', en: 'Netdata' },
          description: {
            bg: 'Метрики в реално време за сървъра',
            en: 'Real-time server metrics',
          },
          url: 'http://192.168.1.10:19999',
          icon: '',
        },
      ],
    },
    {
      id: 'sec-tools',
      icon: '🧰',
      name: { bg: 'Инструменти', en: 'Tools' },
      services: [
        {
          id: 'svc-syncthing',
          name: { bg: 'Syncthing', en: 'Syncthing' },
          description: {
            bg: 'Синхронизация на файлове между устройствата',
            en: 'File sync between your devices',
          },
          url: 'http://192.168.1.20:8384',
          icon: '',
        },
        {
          id: 'svc-nextcloud',
          name: { bg: 'Nextcloud', en: 'Nextcloud' },
          description: {
            bg: 'Личен облак — файлове, календар, контакти',
            en: 'Personal cloud — files, calendar, contacts',
          },
          url: 'http://192.168.1.20:8081',
          icon: '',
        },
        {
          id: 'svc-vscode',
          name: { bg: 'Code Server', en: 'Code Server' },
          description: {
            bg: 'VS Code в браузъра за бързи редакции',
            en: 'VS Code in the browser for quick edits',
          },
          url: 'http://192.168.1.10:8443',
          icon: '',
        },
      ],
    },
  ],
};
