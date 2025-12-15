globalThis.print = jest.fn();

export const addListenerMock = jest.fn((callback) => {
	// Simulate the event firing
	callback();
});
