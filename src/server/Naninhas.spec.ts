import { Commands, NETWORK_MODULE, PROTOCOL_SCHEMA_VERSION } from "@constants";

describe("server Naninhas event registration", () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it("registers OnClientCommand and forwards matching sync commands to the handler", () => {
		const plushieHandlerFn = jest.fn();
		const sleepHandlerFn = jest.fn();
		const handlerCtor = jest.fn(() => ({ handler: plushieHandlerFn }));
		const sleepHandlerCtor = jest.fn(() => ({ handler: sleepHandlerFn }));
		const addListener = jest.fn();

		jest.doMock("@server/components/NaninhasCommandHandler", () => ({
			NaninhasCommandHandler: handlerCtor
		}));
		jest.doMock("@server/components/SleepBuffCommandHandler", () => ({
			SleepBuffCommandHandler: sleepHandlerCtor
		}));
		jest.doMock("@asledgehammer/pipewrench-events", () => ({
			onClientCommand: { addListener }
		}));

		require("./Naninhas");

		expect(handlerCtor).toHaveBeenCalledTimes(1);
		expect(sleepHandlerCtor).toHaveBeenCalledTimes(1);
		expect(addListener).toHaveBeenCalledTimes(1);

		const [listener] = addListener.mock.calls[0] as [
			(module: string, command: string, player: unknown, args: unknown) => void
		];
		const player = { getUsername: jest.fn(() => "server-player") };
		const args = { revision: 7, schemaVersion: PROTOCOL_SCHEMA_VERSION, data: { desiredNames: ["Doll"] } };

		listener(NETWORK_MODULE, Commands.SYNC_PLUSHIE.REQUEST, player, args);
		expect(plushieHandlerFn).toHaveBeenCalledWith({
			module: NETWORK_MODULE,
			command: Commands.SYNC_PLUSHIE.REQUEST,
			player,
			args
		});
		expect(sleepHandlerFn).toHaveBeenCalledWith({
			module: NETWORK_MODULE,
			command: Commands.SYNC_PLUSHIE.REQUEST,
			player,
			args
		});
	});

	it("ignores commands from other modules", () => {
		const handlerFn = jest.fn();
		const sleepHandlerFn = jest.fn();
		const addListener = jest.fn();

		jest.doMock("@server/components/NaninhasCommandHandler", () => ({
			NaninhasCommandHandler: jest.fn(() => ({ handler: handlerFn }))
		}));
		jest.doMock("@server/components/SleepBuffCommandHandler", () => ({
			SleepBuffCommandHandler: jest.fn(() => ({ handler: sleepHandlerFn }))
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
		expect(sleepHandlerFn).not.toHaveBeenCalled();
	});

	it("forwards same-module non-matching commands so handler can filter", () => {
		const handlerFn = jest.fn();
		const sleepHandlerFn = jest.fn();
		const addListener = jest.fn();

		jest.doMock("@server/components/NaninhasCommandHandler", () => ({
			NaninhasCommandHandler: jest.fn(() => ({ handler: handlerFn }))
		}));
		jest.doMock("@server/components/SleepBuffCommandHandler", () => ({
			SleepBuffCommandHandler: jest.fn(() => ({ handler: sleepHandlerFn }))
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
		expect(sleepHandlerFn).toHaveBeenCalledWith({
			module: NETWORK_MODULE,
			command: "OtherCommand",
			player: {},
			args: {}
		});
	});
});
