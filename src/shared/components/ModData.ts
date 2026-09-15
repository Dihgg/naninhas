import type { ModDataProps } from "@types";

/**
 * Wrapper around `object.getModData()` that supports both plain objects and
 * KahluaTable-style `get` / `set` access.
 */
export class ModData<T> {
	private readonly object: ModDataProps<T>["object"];
	private readonly modKey: string;
	private readonly defaultData: T;
	private readonly ensure?: ModDataProps<T>["ensure"];

	/**
	 * Creates a typed view over one entry in an object's mod-data table.
	 *
	 * @param object Object that owns the mod-data table.
	 * @param modKey Key used to store this value.
	 * @param defaultData Value seeded when the key is absent.
	 * @param ensure Optional normalizer for persisted or partial values.
	 */
	constructor({ object, modKey, defaultData, ensure }: ModDataProps<T>) {
		this.object = object;
		this.modKey = modKey;
		this.defaultData = defaultData;
		this.ensure = ensure;
	}

	/** Reads the configured key from either a Kahlua table or plain object. */
	private getValue(store: ReturnType<ModDataProps<T>["object"]["getModData"]>): T | undefined {
		if (typeof store.get === "function") {
			return store.get(this.modKey) as T | undefined;
		}

		return (store as Record<string, T | undefined>)[this.modKey];
	}

	/** Writes the configured key to either a Kahlua table or plain object. */
	private setValue(store: ReturnType<ModDataProps<T>["object"]["getModData"]>, value: T): void {
		if (typeof store.set === "function") {
			store.set(this.modKey, value);
			return;
		}

		(store as Record<string, T | undefined>)[this.modKey] = value;
	}

	/**
	 * Safely retrieve some data from `object.getModData()`.
	 * Seeds defaults when absent and optionally normalizes partial structures.
	 */
	get data(): T {
		const store = this.object.getModData();
		let value = this.getValue(store);

		if (!value) {
			value = this.defaultData;
			this.setValue(store, value);
		}

		if (this.ensure) {
			value = this.ensure(value as Partial<T>);
			this.setValue(store, value);
		}

		return value as T;
	}
}
