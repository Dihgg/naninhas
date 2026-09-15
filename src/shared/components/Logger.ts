import { isDebugEnabled } from "@asledgehammer/pipewrench";

/** Debug-only logger with a configurable module prefix. */
export class Logger {
	/** @param module Module segment included in every emitted log prefix. */
	constructor(private readonly module: string) {}

	/**
	 * Emits a scoped message only while Project Zomboid debug mode is enabled.
	 *
	 * @param scope Additional prefix segments identifying the execution context.
	 * @param message Message to print.
	 */
	log(scope: string[], message: string): void {
		if (!isDebugEnabled()) {
			return;
		}

		const prefix = ["Naninhas", this.module, ...scope].map(part => `[${part}]`).join("");
		print(`${prefix} ${message}`);
	}

	/** Returns a readable comma-separated list or `none` for an empty array. */
	static formatList(values: string[]): string {
		return values.length > 0 ? values.join(", ") : "none";
	}
}
