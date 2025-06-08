// import { Subject as OriginalSubject } from "components/Observer";
export class Subject {
	subscribe = jest.fn();
	unsubscribe = jest.fn();
	update = jest.fn();
	find = jest.fn();
}
