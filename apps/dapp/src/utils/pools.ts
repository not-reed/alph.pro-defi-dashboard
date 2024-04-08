interface PoolLike {
	balance: bigint;
	pool: {
		totalSupply: bigint | string;
		amount0: bigint | string;
		amount1: bigint | string;
		token0: { decimals: number };
		token1: { decimals: number };
	};
}

export function getPoolBreakdown<T extends PoolLike>(a: T) {
	const poolShare = Number(a.balance) / Number(a.pool.totalSupply);
	const token0Balance =
		Number(BigInt(a.pool.amount0) / 10n ** BigInt(a.pool.token0.decimals)) *
		poolShare;
	const token1Balance =
		Number(BigInt(a.pool.amount1) / 10n ** BigInt(a.pool.token1.decimals)) *
		poolShare;

	return { token0Balance, token1Balance, poolShare };
}
