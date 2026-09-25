import type { HeroKey, HeroNameStyle, TemplateKey } from "@/lib/layouts";
import HeroCard from "./card";
import HeroCover from "./cover";
import HeroSplit from "./split";
import HeroType from "./type";

const HEROES = { split: HeroSplit, card: HeroCard, cover: HeroCover, type: HeroType } as const;

export default function Hero(props: {
  weddingId: string;
  hero: HeroKey;
  template: TemplateKey;
  nameStyle: HeroNameStyle;
  showRsvp: boolean;
  showRegistry: boolean;
}) {
  const Component = HEROES[props.hero];
  return <Component {...props} />;
}
