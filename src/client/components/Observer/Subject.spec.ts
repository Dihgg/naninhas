import { mock } from 'jest-mock-extended';
import { Observer } from "./Observer";
import { Subject } from "./Subject";

describe("Subject", () => {
	const observer = mock<Observer>({name: "mock"});
	const subject = new Subject();
	it("Should subscribe", () => {
		subject.subscribe(observer);
		expect(observer.subscribe).toHaveBeenCalled();
	});
	it("Should update the observers", () => {
		subject.update();
		expect(observer.update).toHaveBeenCalled();
	});
	it("Should unsubscribe", () => {
		subject.unsubscribe("mock");
		expect(observer.unsubscribe).toHaveBeenCalled();
	});
});
