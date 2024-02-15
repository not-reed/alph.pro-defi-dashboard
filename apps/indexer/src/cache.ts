import Client from "ioredis";
import Redlock from "redlock";

export const cache = new Client();

export const lock = new Redlock([cache], {
	//
});
