import { RouteCard } from "@/components/RouteCard";
import type { Route } from "@/lib/utils/generateFloorDoors";

type DoorProps = {
  door: {
    id: string | number;
    door: number | string;
    routes: Route[];
  };
};

export function Door({ door }: DoorProps) {
  return (
    <div data-door={door.id} className="bg-blue-500 text-white rounded p-3 w-40">
      <div className="font-semibold">Door {door.door}</div>

      <div className="mt-2 space-y-1 relative">
        {door.routes.map((card) => (
          <RouteCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
