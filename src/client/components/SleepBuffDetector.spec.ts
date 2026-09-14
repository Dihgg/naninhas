import { SleepBuffDetector } from "@client/components/SleepBuffDetector";

describe("SleepBuffDetector radius rules", () => {
	it("uses a circular radius with an inclusive six-square boundary", () => {
		expect(SleepBuffDetector.isOffsetWithinRadius(6, 0, 6)).toBe(true);
		expect(SleepBuffDetector.isOffsetWithinRadius(3, 4, 6)).toBe(true);
		expect(SleepBuffDetector.isOffsetWithinRadius(6, 1, 6)).toBe(false);
		expect(SleepBuffDetector.isOffsetWithinRadius(5, 5, 6)).toBe(false);
	});

	it("accepts only the same room when the player has a room", () => {
		const playerRoom = {};
		expect(SleepBuffDetector.isRoomEligible(playerRoom, playerRoom)).toBe(true);
		expect(SleepBuffDetector.isRoomEligible(playerRoom, {})).toBe(false);
		expect(SleepBuffDetector.isRoomEligible(playerRoom, null)).toBe(false);
	});

	it("does not filter by room when the player is outdoors or roomless", () => {
		expect(SleepBuffDetector.isRoomEligible(null, {})).toBe(true);
		expect(SleepBuffDetector.isRoomEligible(undefined, null)).toBe(true);
	});
});
