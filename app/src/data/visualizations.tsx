
export type Visualization = {
  id: string;
  title: string;
  category: "NIL" | "Players" | "Coaching";
  description: string;
  image: string;
  season: string;
  methodology: string;
};

export const visualizations: Visualization[] = [
  {
    id: "big12-nil-height",
    title: "NIL Spending vs. Player Height",
    category: "NIL",
    description:
      "Examining the relationship between estimated NIL roster spending and the average height of the eight most-used players on each Big 12 basketball team.",
    image: "visualizations/nil/big12_nil_height.png",
    season: "2026–27",
    methodology:
      "The eight players with the highest minutes per game were selected for each team. Their heights were averaged and compared with estimated team roster spending from The NIL Standard. Player data was collected from Sports Reference.",
  },
];
