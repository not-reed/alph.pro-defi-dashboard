import type { FC } from "hono/jsx";
export const theme = {
  calypso: {
    300: "oklch(0.8528 0.035 215.06)",
    800: "oklch(0.4314 0.076 222.23)",
    900: "oklch(0.3322 0.053 220.83)",
    950: "oklch(0.2719 0.036 219.89)",
  },
};

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
      <body
        class="w-full min-h-dvh"
        style={`background: ${theme.calypso["900"]}; color: ${theme.calypso["300"]}`}
      >
        {props.children}
      </body>
    </html>
  );
};
