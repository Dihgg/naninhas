import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { sendServerCommand } from "@asledgehammer/pipewrench";
import { PROTOCOL_SCHEMA_VERSION } from "@constants";
import { CommandHandler } from "@server/components/CommandHandler";
import type { CommandPayload, NetworkCommand, ServerModData } from "@types";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@shared/components/ModData");

type TestAuthoritativeState = {
	count: number;
	tags: string[];
};

type TestRequestPayload = {
	value: string;
};

type TestResponsePayload = {
	accepted: boolean;
};

const TEST_MODULE = "TestModule";
const TEST_COMMAND: NetworkCommand = {
	REQUEST: "Test.Request",
	RESPONSE: "Test.Response"
};

const defaultAuthoritativeState = (): TestAuthoritativeState => ({
	count: 0,
	tags: []
});

const makePlayer = (username = "player"): IsoPlayer => ({
	getUsername: jest.fn().mockReturnValue(username)
} as unknown as IsoPlayer);

const makePayload = (
	revision: number,
	data: TestRequestPayload = { value: "payload" }
): CommandPayload<TestRequestPayload> => ({
	schemaVersion: PROTOCOL_SCHEMA_VERSION,
	revision,
	data
});

class TestCommandHandler extends CommandHandler<TestAuthoritativeState, TestRequestPayload, TestResponsePayload> {
	public readonly onCommandMock = jest.fn();
	public readonly onStaleCommandMock = jest.fn();

	constructor() {
		super(TEST_MODULE, TEST_COMMAND, defaultAuthoritativeState());
	}

	public loadModData(player: IsoPlayer): ServerModData<TestAuthoritativeState> {
		return this.getModData(player);
	}

	public migrateForTest(persistedVersion: number, authoritativeData: unknown): TestAuthoritativeState {
		return this.migrateAuthoritativeData(persistedVersion, authoritativeData);
	}

	public sendResponseForTest(
		player: IsoPlayer,
		payload: CommandPayload<TestRequestPayload>,
		data: TestResponsePayload
	): void {
		this.sendResponse(player, payload, data);
	}

	protected override onCommand(player: IsoPlayer, payload: CommandPayload<TestRequestPayload>): void {
		this.onCommandMock(player, payload);
	}

	protected override onStaleCommand(player: IsoPlayer, payload: CommandPayload<TestRequestPayload>): void {
		this.onStaleCommandMock(player, payload);
	}

	protected override migrateAuthoritativeData(
		_persistedVersion: number,
		authoritativeData: unknown
	): TestAuthoritativeState {
		const authoritative = authoritativeData as Partial<TestAuthoritativeState> | undefined;
		return {
			count: authoritative?.count ?? 0,
			tags: authoritative?.tags ?? []
		};
	}
}

class DefaultStaleCommandHandler extends CommandHandler<TestAuthoritativeState, TestRequestPayload, TestResponsePayload> {
	public readonly onCommandMock = jest.fn();

	constructor() {
		super(TEST_MODULE, TEST_COMMAND, defaultAuthoritativeState());
	}

	public migrateForTest(persistedVersion: number, authoritativeData: unknown): TestAuthoritativeState {
		return this.migrateAuthoritativeData(persistedVersion, authoritativeData);
	}

	protected override onCommand(player: IsoPlayer, payload: CommandPayload<TestRequestPayload>): void {
		this.onCommandMock(player, payload);
	}
}

describe("CommandHandler", () => {
	const sendServerCommandMock = sendServerCommand as jest.MockedFunction<typeof sendServerCommand>;
	const { ModData } = jest.requireMock("@shared/components/ModData");

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("ignores commands from other modules without loading modData", () => {
		const handler = new TestCommandHandler();

		handler.handler({
			module: "OtherModule",
			command: TEST_COMMAND.REQUEST,
			player: makePlayer(),
			args: makePayload(1)
		});

		expect(ModData).not.toHaveBeenCalled();
		expect(handler.onCommandMock).not.toHaveBeenCalled();
		expect(handler.onStaleCommandMock).not.toHaveBeenCalled();
	});

	it("ignores other commands in the same module without loading modData", () => {
		const handler = new TestCommandHandler();

		handler.handler({
			module: TEST_MODULE,
			command: "Other.Request",
			player: makePlayer(),
			args: makePayload(1)
		});

		expect(ModData).not.toHaveBeenCalled();
		expect(handler.onCommandMock).not.toHaveBeenCalled();
		expect(handler.onStaleCommandMock).not.toHaveBeenCalled();
	});

	it("accepts reconnect revision resets and updates persisted protocol state", () => {
		const handler = new TestCommandHandler();
		const serverData: ServerModData<TestAuthoritativeState> = {
			protocol: {
				lastClientRevision: 4,
				lastSchemaVersion: 0
			},
			authoritative: {
				count: 8,
				tags: ["existing"]
			}
		};

		ModData.mockImplementation(() => ({ data: serverData }));

		const player = makePlayer("ReconnectPlayer");
		const payload = makePayload(1, { value: "fresh" });
		handler.handler({
			module: TEST_MODULE,
			command: TEST_COMMAND.REQUEST,
			player,
			args: payload
		});

		expect(handler.onCommandMock).toHaveBeenCalledWith(player, payload);
		expect(serverData.protocol.lastClientRevision).toBe(1);
		expect(serverData.protocol.lastSchemaVersion).toBe(PROTOCOL_SCHEMA_VERSION);
		expect(handler.onStaleCommandMock).not.toHaveBeenCalled();
	});

	it("rejects stale revisions and calls the stale hook", () => {
		const printSpy = jest.spyOn(globalThis as typeof globalThis & { print: typeof print }, "print").mockImplementation(() => undefined);
		const handler = new TestCommandHandler();
		const serverData: ServerModData<TestAuthoritativeState> = {
			protocol: {
				lastClientRevision: 3,
				lastSchemaVersion: 7
			},
			authoritative: defaultAuthoritativeState()
		};

		ModData.mockImplementation(() => ({ data: serverData }));

		const player = makePlayer("StalePlayer");
		const payload = makePayload(3);
		handler.handler({
			module: TEST_MODULE,
			command: TEST_COMMAND.REQUEST,
			player,
			args: payload
		});

		expect(handler.onCommandMock).not.toHaveBeenCalled();
		expect(handler.onStaleCommandMock).toHaveBeenCalledWith(player, payload);
		expect(serverData.protocol.lastSchemaVersion).toBe(7);
		expect(printSpy).toHaveBeenCalledWith(
			`[${TEST_MODULE}][Server][${TEST_COMMAND.REQUEST}] Ignoring stale or out-of-order request from player StalePlayer`
		);

		printSpy.mockRestore();
	});

	it("uses the default stale hook as a no-op when subclasses do not override it", () => {
		const printSpy = jest.spyOn(globalThis as typeof globalThis & { print: typeof print }, "print").mockImplementation(() => undefined);
		const handler = new DefaultStaleCommandHandler();
		const serverData: ServerModData<TestAuthoritativeState> = {
			protocol: {
				lastClientRevision: 9,
				lastSchemaVersion: PROTOCOL_SCHEMA_VERSION
			},
			authoritative: defaultAuthoritativeState()
		};

		ModData.mockImplementation(() => ({ data: serverData }));

		handler.handler({
			module: TEST_MODULE,
			command: TEST_COMMAND.REQUEST,
			player: makePlayer("DefaultStalePlayer"),
			args: makePayload(2)
		});

		expect(handler.onCommandMock).not.toHaveBeenCalled();
		expect(printSpy).toHaveBeenCalledTimes(1);

		printSpy.mockRestore();
	});

	it("normalizes persisted modData through the ensure callback", () => {
		const handler = new TestCommandHandler();
		ModData.mockImplementation(({ ensure }: { ensure: (data: Partial<ServerModData<unknown>>) => ServerModData<TestAuthoritativeState> }) => ({
			data: ensure({
				protocol: {
					lastClientRevision: 6
				},
				authoritative: {
					count: 12
				}
			} as Partial<ServerModData<unknown>>)
		}));

		const modData = handler.loadModData(makePlayer());

		expect(modData).toEqual({
			protocol: {
				lastClientRevision: 6,
				lastSchemaVersion: 0
			},
			authoritative: {
				count: 12,
				tags: []
			}
		});
	});

	it("falls back to default authoritative data when persisted payload is missing", () => {
		const handler = new DefaultStaleCommandHandler();

		const ensured = (handler as unknown as {
			ensureServerModData: (data: Partial<ServerModData<unknown>>) => ServerModData<TestAuthoritativeState>;
		}).ensureServerModData({});

		expect(ensured).toEqual({
			protocol: {
				lastClientRevision: 0,
				lastSchemaVersion: 0
			},
			authoritative: defaultAuthoritativeState()
		});
	});

	it("returns persisted authoritative data unchanged in the default migration implementation", () => {
		const handler = new DefaultStaleCommandHandler();
		const authoritative = {
			count: 5,
			tags: ["raw"]
		};

		expect(handler.migrateForTest(0, authoritative)).toBe(authoritative);
	});

	it("wraps response payloads in the standard command envelope", () => {
		const handler = new TestCommandHandler();
		const player = makePlayer();
		const payload = makePayload(11, { value: "reply" });

		handler.sendResponseForTest(player, payload, { accepted: true });

		expect(sendServerCommandMock).toHaveBeenCalledWith(player, TEST_MODULE, TEST_COMMAND.RESPONSE, {
			schemaVersion: PROTOCOL_SCHEMA_VERSION,
			revision: 11,
			data: {
				accepted: true
			}
		});
	});
});