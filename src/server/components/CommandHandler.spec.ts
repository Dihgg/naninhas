import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { sendServerCommand } from "@asledgehammer/pipewrench";
import { PROTOCOL_SCHEMA_VERSION } from "@constants";
import { CommandHandler } from "@server/components/CommandHandler";
import type { CommandRequestContext } from "@server/components/CommandHandler";
import type { SyncProtocolPayload, SyncProtocolResponse } from "@types";

jest.mock("@asledgehammer/pipewrench");

type TestAuthoritative = {
	count: number;
};

type TestRequest = SyncProtocolPayload & {
	tag?: string;
};

type TestResponse = SyncProtocolResponse & {
	path: "accepted" | "rejected" | "invalid";
};

class TestCommandHandler extends CommandHandler<TestRequest, TestResponse, TestAuthoritative> {
	constructor() {
		super("TestModule", "TestModKey", ["DoThing", "OtherThing"], 42);
	}

	protected getResponseCommand(requestCommand: string): string {
		switch (requestCommand) {
			case "DoThing":
				return "DidThing";
			default:
				return requestCommand;
		}
	}

	protected isValidRequestPayload(value: unknown): value is TestRequest {
		if (!value || typeof value !== "object") return false;
		const payload = value as Partial<TestRequest>;
		return typeof payload.schemaVersion === "number" && typeof payload.revision === "number";
	}

	protected defaultAuthoritativeState(): TestAuthoritative {
		return { count: 0 };
	}

	protected ensureAuthoritativeState(value?: Partial<TestAuthoritative>): TestAuthoritative {
		return { count: value?.count ?? 0 };
	}

	protected buildAcceptedResponse(
		context: CommandRequestContext<TestAuthoritative, TestRequest>
	): TestResponse {
		context.state.authoritative.count += 1;
		return {
			...this.buildResponse(context, "ACCEPTED"),
			path: "accepted"
		};
	}

	protected buildRejectedResponse(
		context: CommandRequestContext<TestAuthoritative, TestRequest>
	): TestResponse {
		return {
			...this.buildResponse(context, "REJECTED"),
			path: "rejected"
		};
	}

	protected buildInvalidPayloadResponse(
		context: CommandRequestContext<TestAuthoritative, TestRequest>
	): TestResponse {
		return {
			...this.buildResponse(context, "REJECTED"),
			path: "invalid"
		};
	}
}

class DefaultSchemaCommandHandler extends CommandHandler<
	TestRequest,
	TestResponse,
	TestAuthoritative
> {
	constructor() {
		super("DefaultModule", "DefaultModKey", ["DoThing"]);
	}

	protected getResponseCommand(requestCommand: string): string {
		return requestCommand;
	}

	protected isValidRequestPayload(value: unknown): value is TestRequest {
		if (!value || typeof value !== "object") return false;
		const payload = value as Partial<TestRequest>;
		return typeof payload.schemaVersion === "number" && typeof payload.revision === "number";
	}

	protected defaultAuthoritativeState(): TestAuthoritative {
		return { count: 0 };
	}

	protected ensureAuthoritativeState(value?: Partial<TestAuthoritative>): TestAuthoritative {
		return { count: value?.count ?? 0 };
	}

	protected buildAcceptedResponse(
		context: CommandRequestContext<TestAuthoritative, TestRequest>
	): TestResponse {
		return {
			...this.buildResponse(context, "ACCEPTED"),
			path: "accepted"
		};
	}

	protected buildRejectedResponse(
		context: CommandRequestContext<TestAuthoritative, TestRequest>
	): TestResponse {
		return {
			...this.buildResponse(context, "REJECTED"),
			path: "rejected"
		};
	}

	protected buildInvalidPayloadResponse(
		context: CommandRequestContext<TestAuthoritative, TestRequest>
	): TestResponse {
		return {
			...this.buildResponse(context, "REJECTED"),
			path: "invalid"
		};
	}
}

type MockPlayer = Pick<IsoPlayer, "getUsername" | "getModData">;

const createPlayer = (username: string, store: Record<string, unknown>): MockPlayer => ({
	getUsername: jest.fn(() => username),
	getModData: jest.fn(() => store)
});

describe("CommandHandler", () => {
	const sendServerCommandMock = sendServerCommand as jest.MockedFunction<typeof sendServerCommand>;

	beforeEach(() => {
		sendServerCommandMock.mockReset();
	});

	it("returns false when module/command are not handled", () => {
		const handler = new TestCommandHandler();
		const player = createPlayer("NoRoute", {});

		const handled = handler.handle("OtherModule", "DoThing", player as IsoPlayer, {});

		expect(handled).toBe(false);
		expect(sendServerCommandMock).not.toHaveBeenCalled();
	});

	it("rejects invalid payload and returns protocol-aware response", () => {
		const handler = new TestCommandHandler();
		const store: Record<string, unknown> = {
			TestModKey: {
				protocol: { lastClientRevision: 3, lastSchemaVersion: 42 },
				authoritative: { count: 7 }
			}
		};
		const player = createPlayer("InvalidPayload", store);

		const handled = handler.handle("TestModule", "DoThing", player as IsoPlayer, { nope: true });

		expect(handled).toBe(true);
		expect(sendServerCommandMock).toHaveBeenCalledWith(
			player,
			"TestModule",
			"DidThing",
			expect.objectContaining({
				revision: 0,
				schemaVersion: 42,
				status: "REJECTED",
				reason: "INVALID_PAYLOAD",
				expectedSchemaVersion: 42,
				lastAcceptedRevision: 3,
				path: "invalid"
			})
		);
	});

	it("rejects schema mismatch without advancing protocol revision", () => {
		const handler = new TestCommandHandler();
		const persisted = {
			protocol: { lastClientRevision: 0, lastSchemaVersion: 42 },
			authoritative: { count: 0 }
		};
		const store: Record<string, unknown> = { TestModKey: persisted };
		const player = createPlayer("SchemaMismatch", store);

		handler.handle("TestModule", "DoThing", player as IsoPlayer, {
			schemaVersion: 999,
			revision: 1
		});

		expect(persisted.protocol.lastClientRevision).toBe(0);
		expect(sendServerCommandMock).toHaveBeenCalledWith(
			player,
			"TestModule",
			"DidThing",
			expect.objectContaining({
				status: "REJECTED",
				reason: "SCHEMA_MISMATCH",
				lastAcceptedRevision: 0,
				path: "rejected"
			})
		);
	});

	it("rejects stale revision requests", () => {
		const handler = new TestCommandHandler();
		const persisted = {
			protocol: { lastClientRevision: 5, lastSchemaVersion: 42 },
			authoritative: { count: 0 }
		};
		const store: Record<string, unknown> = { TestModKey: persisted };
		const player = createPlayer("Stale", store);

		handler.handle("TestModule", "DoThing", player as IsoPlayer, {
			schemaVersion: 42,
			revision: 5
		});

		expect(sendServerCommandMock).toHaveBeenCalledWith(
			player,
			"TestModule",
			"DidThing",
			expect.objectContaining({ reason: "STALE_REVISION", path: "rejected" })
		);
	});

	it("accepts reconnect revision 1 by resetting persisted protocol and advancing state", () => {
		const handler = new TestCommandHandler();
		const persisted = {
			protocol: { lastClientRevision: 9, lastSchemaVersion: 41 },
			authoritative: { count: 10 }
		};
		const store: Record<string, unknown> = { TestModKey: persisted };
		const player = createPlayer("Reconnect", store);

		handler.handle("TestModule", "DoThing", player as IsoPlayer, {
			schemaVersion: 42,
			revision: 1
		});

		const finalState = store.TestModKey as {
			protocol: { lastClientRevision: number; lastSchemaVersion: number };
			authoritative: { count: number };
		};
		expect(finalState.protocol.lastClientRevision).toBe(1);
		expect(finalState.protocol.lastSchemaVersion).toBe(42);
		expect(finalState.authoritative.count).toBe(11);
		expect(sendServerCommandMock).toHaveBeenCalledWith(
			player,
			"TestModule",
			"DidThing",
			expect.objectContaining({
				status: "ACCEPTED",
				revision: 1,
				lastAcceptedRevision: 1,
				path: "accepted"
			})
		);
	});

	it("normalizes missing persisted protocol shape before accepting", () => {
		const handler = new TestCommandHandler();
		const persisted = {
			authoritative: { count: 3 }
		};
		const store: Record<string, unknown> = { TestModKey: persisted };
		const player = createPlayer("NormalizeProtocol", store);

		handler.handle("TestModule", "DoThing", player as IsoPlayer, {
			schemaVersion: 42,
			revision: 2
		});

		const finalState = store.TestModKey as {
			protocol: { lastClientRevision: number; lastSchemaVersion: number };
			authoritative: { count: number };
		};

		expect(finalState.protocol).toEqual({
			lastClientRevision: 2,
			lastSchemaVersion: 42
		});
		expect(finalState.authoritative.count).toBe(4);
	});

	it("falls back to request command as response command for unmapped handled commands", () => {
		const handler = new TestCommandHandler();
		const player = createPlayer("DefaultMap", {});

		handler.handle("TestModule", "OtherThing", player as IsoPlayer, {
			schemaVersion: 42,
			revision: 1
		});

		expect(sendServerCommandMock).toHaveBeenCalledWith(
			player,
			"TestModule",
			"OtherThing",
			expect.objectContaining({ status: "ACCEPTED", path: "accepted" })
		);
	});

	it("uses PROTOCOL_SCHEMA_VERSION when schemaVersion constructor arg is omitted", () => {
		const handler = new DefaultSchemaCommandHandler();
		const player = createPlayer("DefaultSchema", {});

		handler.handle("DefaultModule", "DoThing", player as IsoPlayer, {
			schemaVersion: PROTOCOL_SCHEMA_VERSION,
			revision: 1
		});

		expect(sendServerCommandMock).toHaveBeenCalledWith(
			player,
			"DefaultModule",
			"DoThing",
			expect.objectContaining({
				schemaVersion: PROTOCOL_SCHEMA_VERSION,
				expectedSchemaVersion: PROTOCOL_SCHEMA_VERSION,
				status: "ACCEPTED",
				path: "accepted"
			})
		);
	});
});