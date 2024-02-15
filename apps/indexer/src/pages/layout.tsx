import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Alph.Pro | DeFi Dashboard</title>
        <script src="/static/index.js" defer />
        <script src="//unpkg.com/alpinejs" defer />
        <script src="//cdn.tailwindcss.com" />
      </head>
      <body class="w-full min-h-dvh">{props.children}</body>
    </html>
  );
};
