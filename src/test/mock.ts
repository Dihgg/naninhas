globalThis.print = console.log;

export const addListenerMock = jest.fn((callback) => {
	// Simulate the event firing
	callback();
});
