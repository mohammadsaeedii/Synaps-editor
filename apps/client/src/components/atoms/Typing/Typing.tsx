import s from "./Typing.module.css";

/** The three-dot "assistant is typing" indicator used while a reply streams. */
export function Typing() {
  return (
    <span className={s.typing}>
      <span />
      <span />
      <span />
    </span>
  );
}
