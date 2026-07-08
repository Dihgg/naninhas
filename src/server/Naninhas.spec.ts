import { Commands, NETWORK_MODULE } from "@constants";

describe("server Naninhas event registration", () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it("registers OnClientCommand and forwards matching sync commands to the handler", () => {
		const handlerFn = jest.fn();
		const handlerCtor = jest.fn(() => ({ handler: handlerFn }));
		const addListener = jest.fn();

		jest.doMock("@server/components/NaninhasCommandHandler", () => ({
			NaninhasCommandHandler: handlerCtor
		}));
		jest.doMock("@asledgehammer/pipewrench-events", () => ({
			onClientCommand: { addListener }
		}));

		require("./Naninhas");

		expect(handlerCtor).toHaveBeenCalledTimes(1);
		expect(addListener).toHaveBeenCalledTimes(1);

		const [listener] = addListener.mock.calls[0] as [
			(module: string, command: string, player: unknown, args: unknown) => void
		];
		const player = { getUsername: jest.fn(() => "server-player") };
		const args = { revision: 7, schemaVersion: 1, data: { desiredNames: ["Doll"] } };

		listener(NETWORK_MODULE, Commands.SYNC_PLUSHIE.REQUEST, player, args);
		expect(handlerFn).toHaveBeenCalledWith({
			module: NETWORK_MODULE,
			command: Commands.SYNC_PLUSHIE.REQUEST,
			player,
			args
		});
	});

	it("ignores commands from other modules", () => {
		const handlerFn = jest.fn();
		const addListener = jest.fn();

		jest.doMock("@server/components/NaninhasCommandHandler", () => ({
			NaninhasCommandHandler: jest.fn(() => ({ handler: handlerFn }))
		}));
		jest.doMock("@asledgehammer/pipewrench-events", () => ({
			onClientCommand: { addListener }
		}));

		require("./Naninhas");

		const [listener] = addListener.mock.calls[0] as [
			(module: string, command: string, player: unknown, args: unknown) => void
		];

		listener("OtherModule", Commands.SYNC_PLUSHIE.REQUEST, {}, {});

		expect(handlerFn).not.toHaveBeenCalled();
	});

	it("forwards same-module non-matching commands so handler can filter", () => {
		const handlerFn = jest.fn();
		const addListener = jest.fn();

		jest.doMock("@server/components/NaninhasCommandHandler", () => ({
			NaninhasCommandHandler: jest.fn(() => ({ handler: handlerFn }))
		}));
		jest.doMock("@asledgehammer/pipewrench-events", () => ({
			onClientCommand: { addListener }
		}));

		require("./Naninhas");

		const [listener] = addListener.mock.calls[0] as [
			(module: string, command: string, player: unknown, args: unknown) => void
		];

		listener(NETWORK_MODULE, "OtherCommand", {}, {});

		expect(handlerFn).toHaveBeenCalledWith({
			module: NETWORK_MODULE,
			command: "OtherCommand",
			player: {},
			args: {}
		});
	});
});
