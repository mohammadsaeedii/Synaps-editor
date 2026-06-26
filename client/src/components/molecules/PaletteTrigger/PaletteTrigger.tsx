import { Icon } from "@/design/icons";
import { Kbd } from "@/components/atoms/Kbd/Kbd";
import s from "./PaletteTrigger.module.css";

/** The centred "Search everything (⌘K)" pill in the top bar. */
export function PaletteTrigger({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" className={s.trigger} title="Search everything (⌘K)" onClick={onClick}>
      <Icon name="search" />
      <span>Search files, chats, notes, commands…</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}
