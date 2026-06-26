"use client";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { cx } from "@/lib/utils";
import s from "./Splitter.module.css";

export interface SplitterProps {
  orientation: "v" | "h";
  getSize: () => number;
  setSize: (v: number) => void;
  invert?: boolean;
  onEnd?: () => void;
}

/** A draggable region divider. Mirrors the original `.splitter` pointer math. */
export function Splitter({ orientation, getSize, setSize, invert, onEnd }: SplitterProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startPos = orientation === "v" ? e.clientX : e.clientY;
    const startSize = getSize();
    ref.current?.classList.add(s.active);
    const move = (ev: PointerEvent) => {
      const cur = orientation === "v" ? ev.clientX : ev.clientY;
      let d = cur - startPos;
      if (invert) d = -d;
      setSize(startSize + d);
    };
    const up = () => {
      ref.current?.classList.remove(s.active);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      onEnd?.();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  return <div ref={ref} className={cx(s.splitter, orientation === "v" ? s.v : s.h)} onPointerDown={onDown} />;
}
