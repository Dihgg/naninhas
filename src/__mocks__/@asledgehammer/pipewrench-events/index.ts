const addListener = jest.fn(callback => {
	// Simulate the event firing
	callback();
});

export const onGameStart = {
	addListener
};

export const everyOneMinute = {
	addListener
};
export const onCreatePlayer = {
	addListener
};

export const onGameBoot = {
	addListener
};