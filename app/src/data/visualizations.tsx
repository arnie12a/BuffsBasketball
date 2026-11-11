
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
      "Examining the relationship between estimated NIL roster spending and the average height of teams in the  Big 12.",
    image: "visualizations/nil/big12_nil_height.png",
    season: "2026–27",
    methodology:
      "The eight players with the highest minutes per game were selected from each team. Their heights were averaged and compared with estimated team roster spending from The NIL Standard. Player data was collected from Sports Reference.",
  },
];
