export type Visualization = {
  id: string;
  title: string;
  category: "NIL" | "Players" | "Coaching";
  description: string;
  image: string;
  season: string;
  methodology: string;
  type?: "image" | "interactive";
};

export const visualizations: Visualization[] = [
  {
    id: "big12-nil-explorer",
    title: "Big 12 NIL Roster Explorer",
    category: "NIL",
    description:
      "Compare NIL spending and average player height across all 16 Big 12 teams. Explore frontcourt size and customize player selections.",
    image: "visualizations/nil/big12_nil_height.png",
    season: "2026–27",
    methodology:
      "Roster heights and positions are sourced from Sports Reference. Players are ranked using minutes per game. Estimated roster spending comes from The NIL Standard.",
    type: "interactive",
  },
];
