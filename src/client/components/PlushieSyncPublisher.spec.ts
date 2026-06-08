import { mock } from "jest-mock-extended";
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { getSearchMode, sendClientCommand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { PROTOCOL_SCHEMA_VERSION } from "@constants";
import type { SyncAppliedPlushiesPayload } from "types";
import { PlushieSyncPublisher } from "@client/components/PlushieSyncPublisher";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@shared/catalog/PlushieCatalog");
jest.mock("@shared/components/PlayerApi");

const sendClientCommandMock = sendClientCommand as jest.MockedFunction<typeof sendClientCommand>;
const getSearchModeMock = getSearchMode as jest.MockedFunction<typeof getSearchMode>;

describe("PlushieSyncPublisher", () => {
	const { PlayerApi } = jest.requireMock("@shared/components/PlayerApi");
	const { getPlushieDefinition, isKnownPlushie } = jest.requireMock("@shared/catalog/PlushieCatalog");

	let replyListener: ((module: string, command: string, args: unknown) => void) | undefined;
	let getAttachedItemNamesMock: jest.Mock;
	let hasTraitMock: jest.Mock;
	let blurMock: { setExterior: jest.Mock; setInterior: jest.Mock; setTargets: jest.Mock; equalise: jest.Mock };

	const mockPlayer = () => mock<IsoPlayer>();

	function makePublisher(): PlushieSyncPublisher {
		return new PlushieSyncPublisher(mockPlayer());
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
		getSearchModeMock.mockReset();
		isKnownPlushie.mockReset();
		getPlushieDefinition.mockReset();
		replyListener = undefined;

		getAttachedItemNamesMock = jest.fn(() => new Set<string>());
		hasTraitMock = jest.fn(() => false);
		blurMock = {
			setExterior: jest.fn(),
			setInterior: jest.fn(),
			setTargets: jest.fn(),
			equalise: jest.fn()
		};

		PlayerApi.mockImplementation(() => ({
			player: {
				...mockPlayer(),
				getPlayerNum: jest.fn(() => 0)
			},
			getAttachedItemNames: getAttachedItemNamesMock,
			hasTrait: hasTraitMock
		}));

		getPlushieDefinition.mockImplementation((name: string) => {
			if (name === "Doll") {
				return { traitsToSuppress: ["ShortSighted"] };
			}
			return { traitsToSuppress: [] };
		});

		getSearchModeMock.mockReturnValue({
			getSearchModeForPlayer: jest.fn(() => ({
				getBlur: jest.fn(() => blurMock)
			}))
		} as any);

		(Events.onServerCommand as any) = {
			addListener: jest.fn((fn: typeof replyListener) => {
				replyListener = fn;
			})
		};
	});

	describe("tick()", () => {
		it("does not send when no plushies are attached", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set());
			const pub = makePublisher();
			pub.tick();
			expect(sendClientCommandMock).not.toHaveBeenCalled();
		});

		it("sends in single-player (unified path)", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);
			const pub = makePublisher();
			pub.tick();
			expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
		});

		it("sends when hosting (unified path)", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);
			const pub = makePublisher();
			pub.tick();
			expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
		});

		it("sends when plushies are attached on first tick (differs from empty initial set)", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockImplementation((n: string) => n === "Doll");

			const pub = makePublisher();
			pub.tick();

			expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
			const [, , , payload] = sendClientCommandMock.mock.calls[0];
			expect((payload as any).desiredNames).toContain("Doll");
			expect((payload as any).revision).toBe(1);
			expect((payload as any).schemaVersion).toBe(PROTOCOL_SCHEMA_VERSION);
		});

		it("does not resend when set has not changed after reply", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);

			const pub = makePublisher();
			pub.tick();
			fireReply({ appliedNames: ["Doll"] });

			sendClientCommandMock.mockClear();
			pub.tick();

			expect(sendClientCommandMock).not.toHaveBeenCalled();
		});

		it("resends when a plushie is added after the last reply", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);

			const pub = makePublisher();
			pub.tick();
			fireReply({ appliedNames: ["Doll"] });
			sendClientCommandMock.mockClear();

			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll", "Flamingo"]));
			pub.tick();

			expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
		});

		it("resends when a plushie is removed after the last reply", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);

			const pub = makePublisher();
			pub.tick();
			fireReply({ appliedNames: ["Doll"] });
			sendClientCommandMock.mockClear();

			getAttachedItemNamesMock.mockReturnValue(new Set());
			pub.tick();

			expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
		});

		it("sends corrective empty sync when plushie is detached before server reply arrives", () => {
			// Tick A: Doll attached, sends revision=1, no reply yet
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);
			const pub = makePublisher();
			pub.tick();
			sendClientCommandMock.mockClear();

			// Player detaches before reply arrives (lastKnownNames still {Doll} from send)
			getAttachedItemNamesMock.mockReturnValue(new Set());

			// Tick B: must detect the change and send revision=2 with []
			pub.tick();

			expect(sendClientCommandMock).toHaveBeenCalledTimes(1);
			const [, , , payload] = sendClientCommandMock.mock.calls[0];
			expect((payload as any).desiredNames).toHaveLength(0);
			expect((payload as any).revision).toBe(2);
		});

		it("increments revision on each send", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);

			const pub = makePublisher();
			pub.tick();
			// Force change by returning different set (no reply in between)
			getAttachedItemNamesMock.mockReturnValue(new Set(["Flamingo"]));
			pub.tick();

			const revisions = sendClientCommandMock.mock.calls.map(c => (c[3] as any).revision);
			expect(revisions).toEqual([1, 2]);
		});

		it("only sends known plushies, ignores unknown attached items", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll", "SomeRandomItem"]));
			isKnownPlushie.mockImplementation((n: string) => n === "Doll");

			const pub = makePublisher();
			pub.tick();

			const [, , , payload] = sendClientCommandMock.mock.calls[0];
			expect((payload as any).desiredNames).toContain("Doll");
			expect((payload as any).desiredNames).not.toContain("SomeRandomItem");
		});
	});

	describe("reply handling", () => {
		it("ignores replies for other modules without triggering a resend", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);
			const pub = makePublisher();
			pub.tick();
			sendClientCommandMock.mockClear();

			replyListener?.("OtherMod", "SyncAppliedPlushies", {
				schemaVersion: PROTOCOL_SCHEMA_VERSION,
				revision: 1,
				appliedNames: ["Doll"],
				rejectedNames: []
			});

			// State unchanged — no resend expected
			pub.tick();
			expect(sendClientCommandMock).not.toHaveBeenCalled();
		});

		it("ignores replies with schema mismatch without triggering a resend", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);
			const pub = makePublisher();
			pub.tick();
			sendClientCommandMock.mockClear();

			fireReply({ schemaVersion: 99, appliedNames: ["Doll"] });

			// State unchanged — no resend expected
			pub.tick();
			expect(sendClientCommandMock).not.toHaveBeenCalled();
		});

		it("clears blur when ShortSighted is suppressed by applied plushies", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);
			hasTraitMock.mockReturnValue(false);

			const pub = makePublisher();
			pub.tick();
			fireReply({ appliedNames: ["Doll"] });

			expect(blurMock.setExterior).toHaveBeenCalledWith(0);
			expect(blurMock.setInterior).toHaveBeenCalledWith(0);
			expect(blurMock.setTargets).toHaveBeenCalledWith(0, 0);
			expect(blurMock.equalise).toHaveBeenCalled();
		});

		it("does not clear blur when player still has ShortSighted", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll"]));
			isKnownPlushie.mockReturnValue(true);
			hasTraitMock.mockReturnValue(true);

			const pub = makePublisher();
			pub.tick();
			fireReply({ appliedNames: ["Doll"] });

			expect(blurMock.setTargets).not.toHaveBeenCalled();
		});
	});

	describe("getAttachedPlushieNames()", () => {
		it("returns only known plushie names from attached items", () => {
			getAttachedItemNamesMock.mockReturnValue(new Set(["Doll", "NotAPlushie"]));
			isKnownPlushie.mockImplementation((n: string) => n === "Doll");

			const pub = makePublisher();
			const names = pub.getAttachedPlushieNames();

			expect(names.has("Doll")).toBe(true);
			expect(names.has("NotAPlushie")).toBe(false);
		});
	});
});
