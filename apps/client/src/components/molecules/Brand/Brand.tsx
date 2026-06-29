import { Icon } from "@/design/icons";
import s from "./Brand.module.css";

/** The synapse wordmark in the top bar. */
export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" className={s.brand} title="synapse" onClick={onClick}>
      <span className={s.mark}>
        <Icon name="logo" size={22} />
      </span>
      <span className={s.name}>synapse</span>
    </button>
  );
}
