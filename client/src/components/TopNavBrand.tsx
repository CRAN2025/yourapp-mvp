import { Link } from 'wouter';

export function TopNavBrand() {
  return (
    <Link href="/">
      <a className="flex items-center gap-2 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg">
        <img
          src="/brand/shoplynk-wordmark.svg"
          alt="ShopLynk"
          className="h-7 md:h-8 lg:h-8.5 w-auto leading-none"
          draggable="false"
        />
      </a>
    </Link>
  );
}