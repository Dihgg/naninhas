export const onGameStart = ({
	addListener: jest.fn((callback) => {
		// Simulate the event firing
		callback();
	})
});

export const everyOneMinute = ({
	addListener: jest.fn((callback) => {
		// Simulate the event firing
		callback();
	})
});
