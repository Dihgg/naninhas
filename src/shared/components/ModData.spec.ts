import { mock } from "jest-mock-extended";
import { ModData } from "@shared/components/ModData";

describe("ModData", () => {
	let mockObject: ModData<unknown>['object'];
	let modData: Record<string, unknown>;

	beforeEach(() => {
		modData = {};
		mockObject = mock({
			getModData: jest.fn(() => modData)
		});
	});

	it("returns defaultData if modKey is not present", () => {
		const defaultData = { foo: "bar" };
		const pd = new ModData({
			object: mockObject,
			modKey: "testKey",
			defaultData
		});
		expect(pd.data).toBe(defaultData);
		expect(modData["testKey"]).toBe(defaultData);
	});

	it("returns existing data if modKey is present", () => {
		const existingData = { foo: "baz" };
		modData["testKey"] = existingData;
		const pd = new ModData({
			object: mockObject,
			modKey: "testKey",
			defaultData: { foo: "bar" }
		});
		expect(pd.data).toBe(existingData);
	});

	it("sets defaultData only once if accessed multiple times", () => {
		const defaultData = { foo: "bar" };
		const pd = new ModData({
			object: mockObject,
			modKey: "testKey",
			defaultData
		});
		const first = pd.data;
		const second = pd.data;
		expect(first).toBe(second);
		expect(modData["testKey"]).toBe(defaultData);
	});

	it("works with primitive types as defaultData", () => {
		const pd = new ModData({
			object: mockObject,
			modKey: "numKey",
			defaultData: 42
		});
		expect(pd.data).toBe(42);
	});

	it("does not overwrite existing data with defaultData", () => {
		modData["testKey"] = "existing";
		const pd = new ModData({
			object: mockObject,
			modKey: "testKey",
			defaultData: "default"
		});
		expect(pd.data).toBe("existing");
		expect(modData["testKey"]).toBe("existing");
	});

	it("normalizes partial persisted objects through ensure", () => {
		modData["testKey"] = { foo: "existing" };
		const pd = new ModData({
			object: mockObject,
			modKey: "testKey",
			defaultData: { foo: "default", bar: [] as string[] },
			ensure: (data) => ({
				foo: data.foo ?? "default",
				bar: data.bar ?? []
			})
		});

		expect(pd.data).toEqual({ foo: "existing", bar: [] });
		expect(modData["testKey"]).toEqual({ foo: "existing", bar: [] });
	});

	it("supports KahluaTable-style get and set access", () => {
		const tableStore: Record<string, unknown> = {};
		const tableObject = {
			getModData: jest.fn(() => ({
				get: jest.fn((key: string) => tableStore[key]),
				set: jest.fn((key: string, value: unknown) => {
					tableStore[key] = value;
				})
			}))
		};

		const pd = new ModData({
			object: tableObject,
			modKey: "testKey",
			defaultData: { foo: "bar" }
		});

		expect(pd.data).toEqual({ foo: "bar" });
		expect(tableStore["testKey"]).toEqual({ foo: "bar" });
	});
});
