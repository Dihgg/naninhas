import { addListenerMock } from "@test/mock";

export const onGameStart = {
	addListener: addListenerMock
};

export const everyOneMinute = {
	addListener: addListenerMock
};
export const onCreatePlayer = {
	addListener: jest.fn()
};

export const onGameBoot = {
	addListener: addListenerMock
};
