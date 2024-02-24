export const connectorIds = [
	"injected",
	"walletConnect",
	"desktopWallet",
] as const;
export type ConnectorId = (typeof connectorIds)[number];
