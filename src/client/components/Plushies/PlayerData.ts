import { IsoPlayer } from "@asledgehammer/pipewrench";

type PlayerDataProps<T> = {
	/** The player object from PZ */
	player: IsoPlayer;
	/** The key to be used in `getModData()` */
	modKey: string;
	/** The data that shall be returned by default */
	defaultData: T;
};

/**
 * Wrapper around `player.getModData()` to ensure the data can be retrieve type safely
 */
export class PlayerData<T> {
	private player: IsoPlayer;
	private readonly modKey: string;
	private readonly defaultData: T;

	constructor({ player, modKey, defaultData }: PlayerDataProps<T>) {
		this.player = player;
		this.modKey = modKey;
		this.defaultData = defaultData;
	}

	/**
	 * Safely retrieve some data from `player.getModData()`
	 * @returns The data in expected format
	 */
	get data() {
		if (!this.player.getModData()[this.modKey]) {
			this.player.getModData()[this.modKey] = this.defaultData;
		}
		return this.player.getModData()[this.modKey] as T;
	}
}
