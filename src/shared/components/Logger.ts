import { isDebugEnabled } from "@asledgehammer/pipewrench";

/** Debug-only logger with a configurable module prefix. */
export class Logger {
	constructor(private readonly module: string) {}

	log(scope: string[], message: string): void {
		if (!isDebugEnabled()) {
			return;
		}

		const prefix = ["Naninhas", this.module, ...scope].map(part => `[${part}]`).join("");
		print(`${prefix} ${message}`);
	}

	static formatList(values: string[]): string {
		return values.length > 0 ? values.join(", ") : "none";
	}
}
