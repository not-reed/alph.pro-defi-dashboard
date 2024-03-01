import type { ContractAddress } from "../services/common/types/brands";

export const THIRTY_MINUTES = 1_800_000;
export const ONE_MINUTE = 60_000;
export const FIVE_MINUTES = 300_000;
export const TEN_MINUTES = 600_000;

export const TRIBUTE_TS = 1231006505000;
export const GENESIS_TS = 1636383299070;
export const MAX_DURATION = THIRTY_MINUTES;
export const OVERLAP_WINDOW = FIVE_MINUTES;

// Cron Schedules
export const EVERY_15_SECONDS = "*/15 * * * * *";
export const EVERY_30_SECONDS = "*/30 * * * * *";
export const EVERY_1_MINUTE = "* * * * *";
export const EVERY_30_MINUTES = "*/30 * * * *";

export const ALPH_ADDRESS =
	"tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq" as ContractAddress;

export const AYIN_FACTORY =
	"vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R" as ContractAddress;
