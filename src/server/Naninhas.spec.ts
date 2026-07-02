import { NETWORK_MODULE, NetworkCommands } from "@constants";

describe("server Naninhas event registration", () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it("registers OnClientCommand and forwards matching sync commands to the handler", () => {
		const handle = jest.fn();
		const handlerCtor = jest.fn(() => ({ handle }));
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
		const args = { revision: 7, desiredNames: ["Doll"], schemaVersion: 1 };

		listener(NETWORK_MODULE, NetworkCommands.SYNC_DESIRED_PLUSHIES, player, args);
		expect(handle).toHaveBeenCalledWith(
			NETWORK_MODULE,
			NetworkCommands.SYNC_DESIRED_PLUSHIES,
			player,
			args
		);
	});

	it("ignores unrelated client commands", () => {
		const handle = jest.fn();
		const addListener = jest.fn();

		jest.doMock("@server/components/NaninhasCommandHandler", () => ({
			NaninhasCommandHandler: jest.fn(() => ({ handle }))
		}));
		jest.doMock("@asledgehammer/pipewrench-events", () => ({
			onClientCommand: { addListener }
		}));

		require("./Naninhas");

		const [listener] = addListener.mock.calls[0] as [
			(module: string, command: string, player: unknown, args: unknown) => void
		];

		listener("OtherModule", NetworkCommands.SYNC_DESIRED_PLUSHIES, {}, {});
		listener(NETWORK_MODULE, "OtherCommand", {}, {});

		expect(handle).toHaveBeenCalledTimes(2);
		expect(handle).toHaveBeenNthCalledWith(1, "OtherModule", NetworkCommands.SYNC_DESIRED_PLUSHIES, {}, {});
		expect(handle).toHaveBeenNthCalledWith(2, NETWORK_MODULE, "OtherCommand", {}, {});
	});
});
