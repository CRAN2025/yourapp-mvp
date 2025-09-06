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
    // Per request: link to settings (admin route). Keep as-is for now.
    url: 'https://e5bc3ac1-f41b-4b3a-a672-3e8cd165ff35-00-1ppiewcg3zuzb.picard.replit.dev/settings',
  },
  { key: 'C', name: 'Demo 2' }, // no url yet
  { key: 'P', name: 'Demo 3' }, // no url yet  
  { key: 'V', name: 'Demo 4' }, // no url yet
];

// UTM tagging utility (attached when url exists)
export const withUTM = (url: string): string =>
  `${url}${url.includes('?') ? '&' : '?'}utm_source=landing&utm_medium=demo_tile&utm_campaign=explore_store`;

// Safe href for missing URLs
export const getDemoHref = (demo: Demo): string => 
  demo.url ? withUTM(demo.url) : '/demo/not-ready';