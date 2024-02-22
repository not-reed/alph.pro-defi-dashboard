import QRCodeModal from "@alephium/walletconnect-qrcode-modal";
import {
	ProviderCallbacks,
	_wcConnect,
	_wcDisconnect,
	_wcAutoConnect,
} from "./walletConnect.utils";

import { ConnectResult, ConnectionOptions, Connector } from "./types";

const connect = async (
	options: ConnectionOptions,
	callbacks: Partial<ProviderCallbacks> = {},
): Promise<ConnectResult | undefined> => {
	const result = await _wcConnect(options, {
		...callbacks,
		onDisplayUri: (uri) => {
			QRCodeModal.open(uri, () => console.log("qr closed"));
			callbacks?.onDisplayUri?.(uri);
		},
		onDisconnected: (...args) => callbacks?.onDisconnected?.(...args),
	});
	QRCodeModal.close();

	return result;
};

export const connector = {
	connect: connect,
	disconnect: _wcDisconnect,
	autoConnect: _wcAutoConnect,
} satisfies Connector;
