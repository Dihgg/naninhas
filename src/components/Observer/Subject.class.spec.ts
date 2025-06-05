import { mock } from 'jest-mock-extended';
import { Observer } from "./Observer.interface";
import { Subject } from "./Subject.class";

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