import { mock } from "jest-mock-extended";
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { sendClientCommand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { NetworkRequestCommands, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type { SyncAppliedPlushiesPayload } from "@types";
import { PlushieCommandPublisher } from "@client/components/PlushieCommandPublisher";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");

const sendClientCommandMock = sendClientCommand as jest.MockedFunction<typeof sendClientCommand>;

describe("PlushieCommandPublisher", () => {
	let replyListener: ((module: string, command: string, args: unknown) => void) | undefined;

	function makePublisher(): PlushieCommandPublisher {
		return new PlushieCommandPublisher(mock<IsoPlayer>());
	}

	function fireReply(payload: Partial<SyncAppliedPlushiesPayload>): void {
		const full: SyncAppliedPlushiesPayload = {
			schemaVersion: PROTOCOL_SCHEMA_VERSION,
			revision: 1,
			appliedNames: [],
			rejectedNames: [],
			...payload
		};
		replyListener?.("Naninhas", "SyncAppliedPlushies", full);
	}

	beforeEach(() => {
		sendClientCommandMock.mockReset();
		replyListener = undefined;
		(globalThis as unknown as { tostring: (value: unknown) => string }).tostring = (value: unknown) => String(value);
		jest.spyOn(globalThis as unknown as { print: (...args: unknown[]) => void }, "print").mockImplementation(() => undefined);

		(Events as unknown as { onServerCommand: { addListener: (fn: typeof replyListener) => void } }).onServerCommand = {
			addListener: jest.fn((fn: typeof replyListener) => {
			replyListener = fn;
			})
		};
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("does not send when attached set is unchanged from last acknowledged set", () => {
		const publisher = makePublisher();

		publisher.sendIfChanged(new Set());

		expect(sendClientCommandMock).not.toHaveBeenCalled();
	});

	it("sends when attached set differs from last acknowledged set", () => {
		const publisher = makePublisher();

		publisher.sendIfChanged(new Set(["Doll"]));

		expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
		const [, module, command, payload] = sendClientCommandMock.mock.calls[0];
		expect(module).toBe("Naninhas");
		expect(command).toBe(NetworkRequestCommands.SYNC_DESIRED_PLUSHIES);
		expect((payload as any).desiredNames).toEqual(["Doll"]);
		expect((payload as any).schemaVersion).toBe(PROTOCOL_SCHEMA_VERSION);
		expect((payload as any).revision).toBe(1);
	});

	it("resends until server acknowledges the set", () => {
		const publisher = makePublisher();

		publisher.sendIfChanged(new Set(["Doll"]));
		publisher.sendIfChanged(new Set(["Doll"]));

		expect(sendClientCommandMock).toHaveBeenCalledTimes(2);
		expect((sendClientCommandMock.mock.calls[0][3] as any).revision).toBe(1);
		expect((sendClientCommandMock.mock.calls[1][3] as any).revision).toBe(2);
	});

	it("stops resending after matching ACK is received", () => {
		const publisher = makePublisher();

		publisher.sendIfChanged(new Set(["Doll"]));
		fireReply({ appliedNames: ["Doll"] });
		sendClientCommandMock.mockClear();

		publisher.sendIfChanged(new Set(["Doll"]));

		expect(sendClientCommandMock).not.toHaveBeenCalled();
	});

	it("sends detach sync after an attached plushie was acknowledged", () => {
		const publisher = makePublisher();

		publisher.sendIfChanged(new Set(["Doll"]));
		fireReply({ appliedNames: ["Doll"] });
		sendClientCommandMock.mockClear();

		publisher.sendIfChanged(new Set());

		expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
		expect((sendClientCommandMock.mock.calls[0][3] as any).desiredNames).toEqual([]);
	});

	it("does not treat rejected names as active set", () => {
		const publisher = makePublisher();

		fireReply({ appliedNames: [], rejectedNames: ["Doll"] });
		publisher.sendIfChanged(new Set());

		expect(sendClientCommandMock).not.toHaveBeenCalled();
	});
});
