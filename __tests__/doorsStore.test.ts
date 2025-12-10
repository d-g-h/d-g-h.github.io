import { useDoorsStore } from "@/components/Doors/store";
import { DDBLOCKRULES } from "@/lib/utils/ddDoorRules";

describe("useDoorsStore", () => {
  beforeEach(() => {
    localStorage.removeItem("doors-store");
    useDoorsStore.setState((state) => ({
      ...state,
      doors: {},
      autoDoorByRoute: {},
      doorOverrides: {},
      doorMode: {},
      doorNumbers: [99, 98],
      blockRules: { ...DDBLOCKRULES },
      routes: [],
      overrideRouteId: null,
    }));
  });

  it("reassigns routes away from closed doors", () => {
    const store = useDoorsStore.getState();
    store.generateFromText(["JUTL XL19 F.1 8:00AM", "JUTL XL20 F.2 8:00AM"].join("\n"));

    expect(useDoorsStore.getState().doors[99]?.some((r) => r?.route === "XL19")).toBe(true);

    store.setDoorMode(99); // all -> truck-only
    store.setDoorMode(99); // truck-only -> closed

    const state = useDoorsStore.getState();
    expect((state.doors[99] ?? []).filter(Boolean)).toHaveLength(0);
    const allAssigned = Object.values(state.doors).flatMap((rows) =>
      (rows || []).filter((r): r is NonNullable<typeof r> => Boolean(r)),
    );
    expect(allAssigned.some((r) => r.route === "XL19")).toBe(true);
  });

  it("drops overrides that target closed doors", () => {
    const store = useDoorsStore.getState();
    store.generateFromText("JUTL XL20 F.2 8:00AM");

    const route = useDoorsStore.getState().routes[0];
    expect(route).toBeTruthy();
    if (!route) throw new Error("Expected route");

    store.moveRouteToDoor(route, 99);
    expect(Object.keys(useDoorsStore.getState().doorOverrides).length).toBe(1);

    store.setDoorMode(99); // all -> truck-only
    store.setDoorMode(99); // truck-only -> closed

    const state = useDoorsStore.getState();
    expect(state.doors[99]?.some((r) => r?.route === "XL20")).toBe(false);
    expect(Object.keys(state.doorOverrides).length).toBe(0);
  });

  it("treats CP routes as vans (can’t use truck-only doors)", () => {
    useDoorsStore.setState((state) => ({
      ...state,
      doors: {},
      autoDoorByRoute: {},
      doorOverrides: {},
      doorMode: {},
      doorNumbers: [90, 91],
      blockRules: { ...DDBLOCKRULES },
      routes: [],
      overrideRouteId: null,
    }));

    const store = useDoorsStore.getState();
    store.generateFromText("MTG CP01 C.1 8:00AM");
    expect(useDoorsStore.getState().doors[90]?.some((r) => r?.route === "CP01")).toBe(true);

    store.setDoorMode(90); // all -> truck-only

    const state = useDoorsStore.getState();
    expect(state.doors[90]?.some((r) => r?.route === "CP01")).toBe(false);
    expect(state.doors[91]?.some((r) => r?.route === "CP01")).toBe(true);
  });
});
