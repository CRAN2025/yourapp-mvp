// Demo data mapping with UTM tracking utilities

export interface Demo {
  key: string;
  name: string;
  url?: string;
}

export const DEMOS: Demo[] = [
  {
    key: 'A',
    name: 'Grow Up',
    url: 'https://e5bc3ac1-f41b-4b3a-a672-3e8cd165ff35-00-1ppiewcg3zuzb.picard.replit.dev/settings',
  },
  { key: 'C', name: 'Coastal Treasures' }, // no url yet
  { key: 'P', name: 'Peak Performance' }, // no url yet  
  { key: 'V', name: 'Verde Wellness' }, // no url yet
];

// UTM tagging utility (attached when url exists) with tile parameter
export const withUTM = (url: string, tileKey: string): string =>
  `${url}${url.includes('?') ? '&' : '?'}utm_source=landing&utm_medium=demo_tile&utm_campaign=explore_store&tile=${tileKey}`;

// Safe href for missing URLs
export const getDemoHref = (demo: Demo): string => 
  demo.url ? withUTM(demo.url, demo.key) : '/demo/not-ready';