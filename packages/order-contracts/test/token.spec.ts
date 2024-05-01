import { describe, beforeAll, it, expect } from "bun:test";
import {
	web3,
	Project,
	addressFromContractId,
	DUST_AMOUNT,
	ONE_ALPH,
} from "@alephium/web3";
import {
	getSigner,
	getSigners,
	randomContractId,
	testAddress,
	testNodeWallet,
} from "@alephium/web3-test";
import {
	OrderManager,
	SetMaxDuration,
	SetMinDuration,
	SetOwner,
	SetPrice,
	Subscribe,
	Withdraw,
	type OrderManagerTypes,
} from "../artifacts/ts";

import {
	ONE_MONTH_IN_MS,
	PRICE_PER_MS,
	THREE_MONTH_IN_MS,
	SIX_MONTH_IN_MS,
	ONE_YEAR_IN_MS,
} from "../constants";
import { calculateGas, deployOrderManager } from "./utils";

describe("unit tests", () => {
	let testContractId: string;
	let testTokenId: string;
	let testContractAddress: string;
	let testInitialFields: OrderManagerTypes.Fields;

	beforeAll(async () => {
		web3.setCurrentNodeProvider("http://127.0.0.1:22973");
		await Project.build();
		testContractId = randomContractId();
		testTokenId = testContractId;
		testContractAddress = addressFromContractId(testContractId);
		testInitialFields = {
			price: PRICE_PER_MS, //5n * 10n ** 18n,
			owner: testAddress,
			minDuration: ONE_MONTH_IN_MS, // one month
			maxDuration: ONE_MONTH_IN_MS * 12n, // one year
		};
	});

	it("test subscribe", async () => {
		const beforeTimestamp = BigInt(new Date().getTime());

		const INITIAL_BALANCE = 10n * ONE_ALPH;
		const testResult = await OrderManager.tests.subscribe({
			initialFields: testInitialFields,
			testArgs: { duration: ONE_MONTH_IN_MS },
			inputAssets: [
				{
					address: testAddress,
					asset: {
						alphAmount: INITIAL_BALANCE,
					},
				},
			],
		});

		// events
		expect(testResult.events.length).toEqual(1);
		const [subscribeEvent] = testResult.events;
		expect(subscribeEvent.name).toEqual("Subscribe");
		expect(subscribeEvent.fields.who).toEqual(testAddress);
		expect(subscribeEvent.fields.amount).toEqual(4999999999932000000n); // roughly 5 alph per month
		expect(subscribeEvent.fields.when).toBeGreaterThanOrEqual(beforeTimestamp);
		expect(subscribeEvent.fields.duration).toEqual(ONE_MONTH_IN_MS);

		// UTXO
		const contractOutput = testResult.txOutputs.find(
			(a) => a.type === "ContractOutput",
		);
		const userOutput = testResult.txOutputs.find(
			(a) => a.type === "AssetOutput",
		);
		expect(contractOutput?.alphAmount).toEqual(5999999999932000000n);
		expect(userOutput?.alphAmount).toBeLessThan(INITIAL_BALANCE);

		// contract assets
		expect(testResult.contracts.length).toEqual(1);
		const [contract] = testResult.contracts;
		expect(contract.asset.alphAmount).toEqual(5999999999932000000n);
	});

	it("test withdraw", async () => {
		const beforeTimestamp = BigInt(new Date().getTime());

		const INITIAL_BALANCE = 10n * ONE_ALPH;
		const testResult = await OrderManager.tests.withdraw({
			initialFields: testInitialFields,
			testArgs: { amount: 4999999999932000000n },
			initialAsset: {
				alphAmount: 5999999999932000000n,
			},
			inputAssets: [
				{
					address: testAddress,
					asset: {
						alphAmount: INITIAL_BALANCE * 8n,
					},
				},
			],
		});

		// events
		expect(testResult.events.length).toEqual(1);
		const [subscribeEvent] = testResult.events;
		expect(subscribeEvent.name).toEqual("Withdraw");
		expect(subscribeEvent.fields.who).toEqual(testAddress);
		expect(subscribeEvent.fields.amount).toEqual(4999999999932000000n);
		expect(subscribeEvent.fields.when).toBeGreaterThanOrEqual(beforeTimestamp);

		// UTXO
		const contractOutput = testResult.txOutputs.find(
			(a) => a.type === "ContractOutput",
		);
		const userOutput = testResult.txOutputs.find(
			(a) => a.type === "AssetOutput",
		);

		expect(contractOutput?.alphAmount).toEqual(ONE_ALPH);
		expect(userOutput?.alphAmount).toBeGreaterThan(INITIAL_BALANCE);

		// contract assets
		expect(testResult.contracts.length).toEqual(1);
		const [contract] = testResult.contracts;
		expect(contract.asset.alphAmount).toEqual(ONE_ALPH);
	});
});

describe("integration tests", () => {
	beforeAll(async () => {
		web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);
		await Project.build();
	});

	it("should deploy with correct fields", async () => {
		const account = await testNodeWallet().then((a) =>
			a.getAccount(testAddress),
		);

		const orderManager = await deployOrderManager();

		expect(orderManager.groupIndex).toEqual(0);

		const initialState = await orderManager.fetchState();

		expect(initialState.fields.price).toEqual(1902587519n);
		expect(initialState.fields.price * ONE_MONTH_IN_MS).toEqual(
			4999999999932000000n,
		);
		expect(initialState.fields.owner).toEqual(account.address);
		expect(initialState.fields.minDuration).toEqual(ONE_MONTH_IN_MS);
		expect(initialState.fields.maxDuration).toEqual(ONE_MONTH_IN_MS * 12n);
	});

	it("should allow multiple people to subscribe for multiple durations", async () => {
		const BEFORE_TIMESTAMP = BigInt(new Date().getTime());

		const orderManager = await deployOrderManager();

		const SIGNER_COUNT = 4;
		const signers = await getSigners(SIGNER_COUNT, 100n * ONE_ALPH, 0);
		const months = [1n, 3n, 6n, 12n];

		// catch one event per signer
		const eventPromises = new Promise<OrderManagerTypes.SubscribeEvent[]>(
			(resolve, reject) => {
				const events: OrderManagerTypes.SubscribeEvent[] = [];
				const subscription = orderManager.subscribeSubscribeEvent({
					pollingInterval: 0,
					errorCallback: async (error) => {
						subscription.unsubscribe();
						reject(error);
					},
					messageCallback: async (event) => {
						events.push(event);
						if (events.length === SIGNER_COUNT) {
							subscription.unsubscribe();
							resolve(events);
						}
					},
				});
			},
		);

		for (const account of signers) {
			const month = months.shift();
			if (!month) {
				throw new Error("Failed to find month for test");
			}

			PRICE_PER_MS;

			await Subscribe.execute(account, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: ONE_MONTH_IN_MS * month,
				},
				attoAlphAmount: ONE_MONTH_IN_MS * PRICE_PER_MS * month,
			});
		}

		const state = await orderManager.fetchState();

		expect(state.asset.alphAmount).toEqual(
			// ONE_ALPH for contract + sum of all subscriptions
			ONE_ALPH + ONE_MONTH_IN_MS * PRICE_PER_MS * 22n,
		);

		const [oneMonthSub, threeMonthSub, sixMonthSub, twelveMonthSub] =
			await eventPromises;

		expect(oneMonthSub.fields.who).toEqual(signers[0].address);
		expect(oneMonthSub.fields.amount).toEqual(ONE_MONTH_IN_MS * PRICE_PER_MS);
		expect(oneMonthSub.fields.duration).toEqual(ONE_MONTH_IN_MS);
		expect(oneMonthSub.fields.when).toBeGreaterThanOrEqual(BEFORE_TIMESTAMP);

		expect(threeMonthSub.fields.who).toEqual(signers[1].address);
		expect(threeMonthSub.fields.amount).toEqual(
			THREE_MONTH_IN_MS * PRICE_PER_MS,
		);
		expect(threeMonthSub.fields.duration).toEqual(THREE_MONTH_IN_MS);
		expect(threeMonthSub.fields.when).toBeGreaterThanOrEqual(BEFORE_TIMESTAMP);

		expect(sixMonthSub.fields.who).toEqual(signers[2].address);
		expect(sixMonthSub.fields.amount).toEqual(SIX_MONTH_IN_MS * PRICE_PER_MS);
		expect(sixMonthSub.fields.duration).toEqual(SIX_MONTH_IN_MS);
		expect(sixMonthSub.fields.when).toBeGreaterThanOrEqual(BEFORE_TIMESTAMP);

		expect(twelveMonthSub.fields.who).toEqual(signers[3].address);
		expect(twelveMonthSub.fields.amount).toEqual(ONE_YEAR_IN_MS * PRICE_PER_MS);
		expect(twelveMonthSub.fields.duration).toEqual(ONE_YEAR_IN_MS);
		expect(twelveMonthSub.fields.when).toBeGreaterThanOrEqual(BEFORE_TIMESTAMP);
	});

	it("should not allow users to subscribe with invalid duration", async () => {
		const orderManager = await deployOrderManager();
		const signer = await getSigner();

		await expect(
			Subscribe.execute(signer, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: 0n,
				},
				attoAlphAmount: 0n,
			}),
		).rejects.toThrow(
			new RegExp(
				`Error Code: ${OrderManager.consts.ErrorCodes.InvalidDuration}$`,
			),
		);

		await expect(
			Subscribe.execute(signer, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: ONE_MONTH_IN_MS * 13n,
				},
				attoAlphAmount: ONE_MONTH_IN_MS * PRICE_PER_MS * 13n,
			}),
		).rejects.toThrow(
			new RegExp(
				`Error Code: ${OrderManager.consts.ErrorCodes.InvalidDuration}$`,
			),
		);
	});

	it("should not allow users to withdraw alph", async () => {
		const orderManager = await deployOrderManager();

		const signer = await getSigner();

		await Subscribe.execute(signer, {
			initialFields: {
				orderManager: orderManager.contractId,
				duration: SIX_MONTH_IN_MS,
			},
			attoAlphAmount: SIX_MONTH_IN_MS * PRICE_PER_MS,
		});

		const state = await orderManager.fetchState();

		expect(state.asset.alphAmount).toEqual(
			// ONE_ALPH for contract + sum of all subscriptions
			ONE_ALPH + SIX_MONTH_IN_MS * PRICE_PER_MS,
		);

		await expect(
			Withdraw.execute(signer, {
				initialFields: {
					orderManager: orderManager.contractId,
					amount: SIX_MONTH_IN_MS * PRICE_PER_MS,
				},
				attoAlphAmount: DUST_AMOUNT,
			}),
		).rejects.toThrow(
			new RegExp(`Error Code: ${OrderManager.consts.ErrorCodes.Forbidden}$`),
		);
	});

	it("should allow owner to withdraw alph", async () => {
		const orderManager = await deployOrderManager();

		const signer = await getSigner();

		await Subscribe.execute(signer, {
			initialFields: {
				orderManager: orderManager.contractId,
				duration: SIX_MONTH_IN_MS,
			},
			attoAlphAmount: SIX_MONTH_IN_MS * PRICE_PER_MS,
		});

		const state = await orderManager.fetchState();

		expect(state.asset.alphAmount).toEqual(
			// ONE_ALPH for contract + sum of all subscriptions
			ONE_ALPH + SIX_MONTH_IN_MS * PRICE_PER_MS,
		);

		const owner = await testNodeWallet();
		const beforeBalance =
			await owner.nodeProvider.addresses.getAddressesAddressBalance(
				(await owner.getSelectedAccount()).address,
			);

		const tx = await Withdraw.execute(owner, {
			initialFields: {
				orderManager: orderManager.contractId,
				amount: SIX_MONTH_IN_MS * PRICE_PER_MS,
			},
			attoAlphAmount: DUST_AMOUNT,
		});

		const afterBalance =
			await owner.nodeProvider.addresses.getAddressesAddressBalance(
				(await owner.getSelectedAccount()).address,
			);

		expect(BigInt(afterBalance.balance)).toEqual(
			BigInt(beforeBalance.balance) +
				SIX_MONTH_IN_MS * PRICE_PER_MS -
				calculateGas(tx),
		);
	});

	it("should not allow users to update price", async () => {
		const orderManager = await deployOrderManager();
		const signer = await getSigner();

		await expect(
			SetPrice.execute(signer, {
				initialFields: {
					orderManager: orderManager.contractId,
					price: 2n * PRICE_PER_MS, // doubled
				},
			}),
		).rejects.toThrow(
			new RegExp(`Error Code: ${OrderManager.consts.ErrorCodes.Forbidden}$`),
		);
	});

	it("should allow owner to update price", async () => {
		const orderManager = await deployOrderManager();
		const owner = await testNodeWallet();

		await SetPrice.execute(owner, {
			initialFields: {
				orderManager: orderManager.contractId,
				price: 2n * PRICE_PER_MS, // doubled
			},
		});

		await expect(
			Subscribe.execute(owner, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: ONE_MONTH_IN_MS,
				},
				attoAlphAmount: ONE_MONTH_IN_MS * PRICE_PER_MS,
			}),
		).rejects.toThrow("Not enough approved balance for address");

		await expect(
			Subscribe.execute(owner, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: ONE_MONTH_IN_MS,
				},
				attoAlphAmount: ONE_MONTH_IN_MS * PRICE_PER_MS * 2n,
			}),
		).resolves.toBeDefined();
	});

	it("should not allow users to update owner", async () => {
		const orderManager = await deployOrderManager();
		const signer = await getSigner();

		await expect(
			SetOwner.execute(signer, {
				initialFields: {
					orderManager: orderManager.contractId,
					owner: signer.address,
				},
			}),
		).rejects.toThrow(
			new RegExp(`Error Code: ${OrderManager.consts.ErrorCodes.Forbidden}$`),
		);
	});

	it("should allow owner to update owner", async () => {
		const orderManager = await deployOrderManager();
		const owner = await testNodeWallet();
		const signer = await getSigner();

		await SetOwner.execute(owner, {
			initialFields: {
				orderManager: orderManager.contractId,
				owner: signer.address,
			},
		});

		await expect(
			SetOwner.execute(owner, {
				initialFields: {
					orderManager: orderManager.contractId,
					owner: signer.address,
				},
			}),
		).rejects.toThrow(
			new RegExp(`Error Code: ${OrderManager.consts.ErrorCodes.Forbidden}$`),
		);

		const state1 = await orderManager.fetchState();
		expect(state1.fields.owner).toEqual(signer.address);

		await SetOwner.execute(signer, {
			initialFields: {
				orderManager: orderManager.contractId,
				owner: testAddress,
			},
		});

		const state2 = await orderManager.fetchState();
		expect(state2.fields.owner).toEqual(testAddress);
	});

	it("should not allow users to update min duration", async () => {
		const orderManager = await deployOrderManager();
		const signer = await getSigner();

		await expect(
			SetMinDuration.execute(signer, {
				initialFields: {
					orderManager: orderManager.contractId,
					minDuration: THREE_MONTH_IN_MS, // doubled
				},
			}),
		).rejects.toThrow(
			new RegExp(`Error Code: ${OrderManager.consts.ErrorCodes.Forbidden}$`),
		);
	});

	it("should allow owner to update min duration", async () => {
		const orderManager = await deployOrderManager();
		const owner = await testNodeWallet();

		await SetMinDuration.execute(owner, {
			initialFields: {
				orderManager: orderManager.contractId,
				minDuration: THREE_MONTH_IN_MS, // doubled
			},
		});

		await expect(
			Subscribe.execute(owner, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: ONE_MONTH_IN_MS,
				},
				attoAlphAmount: ONE_MONTH_IN_MS * PRICE_PER_MS,
			}),
		).rejects.toThrow(
			new RegExp(
				`Error Code: ${OrderManager.consts.ErrorCodes.InvalidDuration}$`,
			),
		);

		await expect(
			Subscribe.execute(owner, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: THREE_MONTH_IN_MS,
				},
				attoAlphAmount: THREE_MONTH_IN_MS * PRICE_PER_MS,
			}),
		).resolves.toBeDefined();
	});

	it("should not allow users to update max duration", async () => {
		const orderManager = await deployOrderManager();
		const signer = await getSigner();

		await expect(
			SetMaxDuration.execute(signer, {
				initialFields: {
					orderManager: orderManager.contractId,
					maxDuration: THREE_MONTH_IN_MS, // doubled
				},
			}),
		).rejects.toThrow(
			new RegExp(`Error Code: ${OrderManager.consts.ErrorCodes.Forbidden}$`),
		);
	});

	it("should allow owner to update max duration", async () => {
		const orderManager = await deployOrderManager();
		const owner = await testNodeWallet();

		await SetMaxDuration.execute(owner, {
			initialFields: {
				orderManager: orderManager.contractId,
				maxDuration: THREE_MONTH_IN_MS, // doubled
			},
		});

		await expect(
			Subscribe.execute(owner, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: SIX_MONTH_IN_MS,
				},
				attoAlphAmount: SIX_MONTH_IN_MS * PRICE_PER_MS,
			}),
		).rejects.toThrow(
			new RegExp(
				`Error Code: ${OrderManager.consts.ErrorCodes.InvalidDuration}$`,
			),
		);

		await expect(
			Subscribe.execute(owner, {
				initialFields: {
					orderManager: orderManager.contractId,
					duration: THREE_MONTH_IN_MS,
				},
				attoAlphAmount: THREE_MONTH_IN_MS * PRICE_PER_MS,
			}),
		).resolves.toBeDefined();
	});
});
