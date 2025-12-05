export type Region = {
  id: string;
  label?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: "door" | "lane" | "aisle" | "staging" | "forbidden";
  color?: string;
  dsp?: string;
  staging?: string;
  route?: string;
  wave?: number;
  waveTime?: string;
  dockDoor?: string;
  active?: boolean;
  preload?: boolean;
  vehicle?: "truck" | "van";
  doorMode?: import("@/lib/utils/doors").DoorMode;
};

export type FloorDimensions = {
  width: number;
  height: number;
};

const LOGICAL_FLOOR_DIMENSIONS: FloorDimensions = {
  width: 21,
  height: 4,
};

export const HORIZONTAL_SCALE = 2;

export const BASE_FLOOR_DIMENSIONS: FloorDimensions = {
  width: LOGICAL_FLOOR_DIMENSIONS.width * HORIZONTAL_SCALE,
  height: LOGICAL_FLOOR_DIMENSIONS.height,
};

function scaleRegionHorizontally(region: Region, scale: number): Region {
  const logicalWidth = region.endX - region.startX + 1;
  const startX = region.startX * scale;
  return {
    ...region,
    startX,
    endX: startX + logicalWidth * scale - 1,
  };
}

const LOGICAL_FLOOR_REGIONS: Region[] = [
  {
    id: "leadership",
    label: "Leadership",
    type: "aisle",
    startX: 1,
    startY: 0,
    endX: 1,
    endY: 0,
    color: "oklch(from #cbd5e1 l c h)",
  },

  // Doors (top row)
  {
    id: "door_99",
    label: "99",
    type: "door",
    startX: 2,
    startY: 0,
    endX: 2,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_98",
    label: "98",
    type: "door",
    startX: 3,
    startY: 0,
    endX: 3,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_97",
    label: "97",
    type: "door",
    startX: 4,
    startY: 0,
    endX: 4,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_96",
    label: "96",
    type: "door",
    startX: 5,
    startY: 0,
    endX: 5,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_95",
    label: "95",
    type: "door",
    startX: 6,
    startY: 0,
    endX: 6,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_94",
    label: "94",
    type: "door",
    startX: 7,
    startY: 0,
    endX: 7,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_93",
    label: "93",
    type: "door",
    startX: 8,
    startY: 0,
    endX: 8,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_92",
    label: "92",
    type: "door",
    startX: 9,
    startY: 0,
    endX: 9,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_91",
    label: "91",
    type: "door",
    startX: 10,
    startY: 0,
    endX: 10,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_90",
    label: "90",
    type: "door",
    startX: 11,
    startY: 0,
    endX: 11,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_89",
    label: "89",
    type: "door",
    startX: 12,
    startY: 0,
    endX: 12,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_88",
    label: "88",
    type: "door",
    startX: 13,
    startY: 0,
    endX: 13,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_87",
    label: "87",
    type: "door",
    startX: 14,
    startY: 0,
    endX: 14,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_86",
    label: "86",
    type: "door",
    startX: 15,
    startY: 0,
    endX: 15,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_85",
    label: "85",
    type: "door",
    startX: 16,
    startY: 0,
    endX: 16,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_84",
    label: "84",
    type: "door",
    startX: 17,
    startY: 0,
    endX: 17,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },
  {
    id: "door_83",
    label: "83",
    type: "door",
    startX: 18,
    startY: 0,
    endX: 18,
    endY: 0,
    color: "oklch(from #6b7280 l c h)",
  },

  // I lanes (row 1)
  {
    id: "i_1",
    label: "i.1",
    type: "lane",
    startX: 2,
    startY: 1,
    endX: 2,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_2",
    label: "i.2",
    type: "lane",
    startX: 3,
    startY: 1,
    endX: 3,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_3",
    label: "i.3",
    type: "lane",
    startX: 4,
    startY: 1,
    endX: 4,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_4",
    label: "i.4",
    type: "lane",
    startX: 5,
    startY: 1,
    endX: 5,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_5",
    label: "i.5",
    type: "lane",
    startX: 6,
    startY: 1,
    endX: 6,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_6",
    label: "i.6",
    type: "lane",
    startX: 7,
    startY: 1,
    endX: 7,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_7",
    label: "i.7",
    type: "lane",
    startX: 8,
    startY: 1,
    endX: 8,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },

  // Down stack block
  {
    id: "down_stack",
    label: "Down Stack",
    type: "staging",
    startX: 11,
    startY: 1,
    endX: 13,
    endY: 2,
    color: "oklch(from #e0d4f6 l c h)",
  },

  // I lanes continued (row 1)
  {
    id: "i_8",
    label: "i.8",
    type: "lane",
    startX: 14,
    startY: 1,
    endX: 14,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_9",
    label: "i.9",
    type: "lane",
    startX: 15,
    startY: 1,
    endX: 15,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_10",
    label: "i.10",
    type: "lane",
    startX: 16,
    startY: 1,
    endX: 16,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_11",
    label: "i.11",
    type: "lane",
    startX: 17,
    startY: 1,
    endX: 17,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },
  {
    id: "i_12",
    label: "i.12",
    type: "lane",
    startX: 18,
    startY: 1,
    endX: 18,
    endY: 1,
    color: "oklch(from #8db6e8 l c h)",
  },

  // F/J lanes (row 2)
  {
    id: "f_1",
    label: "F.1",
    type: "lane",
    startX: 2,
    startY: 2,
    endX: 2,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_2",
    label: "F.2",
    type: "lane",
    startX: 3,
    startY: 2,
    endX: 3,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_3",
    label: "F.3",
    type: "lane",
    startX: 4,
    startY: 2,
    endX: 4,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_4",
    label: "F.4",
    type: "lane",
    startX: 5,
    startY: 2,
    endX: 5,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_5",
    label: "F.5",
    type: "lane",
    startX: 6,
    startY: 2,
    endX: 6,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_6",
    label: "F.6",
    type: "lane",
    startX: 7,
    startY: 2,
    endX: 7,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "j_2",
    label: "J.2",
    type: "lane",
    startX: 10,
    startY: 2,
    endX: 10,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_7",
    label: "F.7",
    type: "lane",
    startX: 14,
    startY: 2,
    endX: 14,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_8",
    label: "F.8",
    type: "lane",
    startX: 15,
    startY: 2,
    endX: 15,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_9",
    label: "F.9",
    type: "lane",
    startX: 16,
    startY: 2,
    endX: 16,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_10",
    label: "F.10",
    type: "lane",
    startX: 17,
    startY: 2,
    endX: 17,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_11",
    label: "F.11",
    type: "lane",
    startX: 18,
    startY: 2,
    endX: 18,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "f_12",
    label: "F.12",
    type: "lane",
    startX: 19,
    startY: 2,
    endX: 19,
    endY: 2,
    color: "oklch(from #ccead8 l c h)",
  },
  {
    id: "g_2",
    label: "G.2",
    type: "lane",
    startX: 20,
    startY: 2,
    endX: 20,
    endY: 2,
    color: "oklch(from #f5cfc2 l c h)",
  },

  // Lower staging row (row 3)
  {
    id: "c_1",
    label: "C1",
    type: "staging",
    startX: 2,
    startY: 3,
    endX: 2,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "c_2",
    label: "C2",
    type: "staging",
    startX: 3,
    startY: 3,
    endX: 3,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "c_3",
    label: "C3",
    type: "staging",
    startX: 4,
    startY: 3,
    endX: 4,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "c_4",
    label: "C4",
    type: "staging",
    startX: 5,
    startY: 3,
    endX: 5,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "c_5",
    label: "C5",
    type: "staging",
    startX: 6,
    startY: 3,
    endX: 6,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "c_6",
    label: "C6",
    type: "staging",
    startX: 7,
    startY: 3,
    endX: 7,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "c_7",
    label: "C7",
    type: "staging",
    startX: 8,
    startY: 3,
    endX: 8,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "cp2",
    label: "CP2",
    type: "staging",
    startX: 9,
    startY: 3,
    endX: 9,
    endY: 3,
    color: "oklch(from #f5e6b8 l c h)",
  },
  {
    id: "xl1",
    label: "XL1",
    type: "staging",
    startX: 10,
    startY: 3,
    endX: 10,
    endY: 3,
    color: "oklch(from #e2e8f0 l c h)",
  },
  {
    id: "xl3",
    label: "XL3",
    type: "staging",
    startX: 11,
    startY: 3,
    endX: 11,
    endY: 3,
    color: "oklch(from #e2e8f0 l c h)",
  },
  {
    id: "area",
    label: "Area",
    type: "staging",
    startX: 12,
    startY: 3,
    endX: 14,
    endY: 3,
    color: "oklch(from #e0d4f6 l c h)",
  },
  {
    id: "xl4",
    label: "XL4",
    type: "staging",
    startX: 15,
    startY: 3,
    endX: 15,
    endY: 3,
    color: "oklch(from #e2e8f0 l c h)",
  },
  {
    id: "xl6",
    label: "XL6",
    type: "staging",
    startX: 16,
    startY: 3,
    endX: 16,
    endY: 3,
    color: "oklch(from #e2e8f0 l c h)",
  },
  {
    id: "g1",
    label: "G1",
    type: "staging",
    startX: 17,
    startY: 3,
    endX: 17,
    endY: 3,
    color: "oklch(from #f5cfc2 l c h)",
  },
  {
    id: "g3",
    label: "G3",
    type: "staging",
    startX: 18,
    startY: 3,
    endX: 18,
    endY: 3,
    color: "oklch(from #f5cfc2 l c h)",
  },
  {
    id: "ex1",
    label: "EX1",
    type: "staging",
    startX: 19,
    startY: 3,
    endX: 19,
    endY: 3,
    color: "oklch(from #cbd5e1 l c h)",
  },
  {
    id: "xl7",
    label: "XL7",
    type: "staging",
    startX: 20,
    startY: 3,
    endX: 20,
    endY: 3,
    color: "oklch(from #e2e8f0 l c h)",
  },
];

export const floorRegions: Region[] = LOGICAL_FLOOR_REGIONS.map((region) =>
  scaleRegionHorizontally(region, HORIZONTAL_SCALE),
);

export function floorToMatrix(regions: Region[], width: number, height: number): string[][] {
  const matrix = Array.from({ length: height }, () => Array.from({ length: width }, () => "0"));

  for (const region of regions) {
    if (region.startX > region.endX || region.startY > region.endY) {
      throw new Error(`Region "${region.id}" has invalid coordinates`);
    }

    if (region.startX < 0 || region.startY < 0 || region.endX >= width || region.endY >= height) {
      throw new Error(`Region "${region.id}" is out of bounds for ${width}x${height} grid`);
    }

    for (let y = region.startY; y <= region.endY; y += 1) {
      for (let x = region.startX; x <= region.endX; x += 1) {
        if (matrix[y][x] !== "0") {
          throw new Error(`Region "${region.id}" overlaps with "${matrix[y][x]}" at (${x}, ${y})`);
        }
        matrix[y][x] = region.id;
      }
    }
  }

  return matrix;
}
