export function truncateAddress(address: string, maxLength = 24) {
	if (address.length <= maxLength) return address;
	return `${address.slice(0, maxLength / 2 - 1)}...${address.slice(
		-1 * (maxLength / 2 - 1),
	)}`;
}
