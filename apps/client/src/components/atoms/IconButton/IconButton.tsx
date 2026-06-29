import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, isIconName, type IconName } from "@/design/icons";
import { cx } from "@/lib/utils";
import s from "./IconButton.module.css";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName | ReactNode;
  active?: boolean;
  /** Override the 30px button box for a given context (inline → always wins). */
  size?: number;
  /** Override the 18px glyph for a given context. */
  iconSize?: number;
}

/** A square icon-only button. Mirrors the original `.iconbtn`. */
export function IconButton({ icon, active, size, iconSize, className, type = "button", title, "aria-label": ariaLabel, style, ...rest }: IconButtonProps) {
  const mergedStyle = size ? { width: size, height: size, ...style } : style;
  const node = isIconName(icon) ? <Icon name={icon} size={iconSize} style={iconSize ? { width: iconSize, height: iconSize } : undefined} /> : icon;
  return (
    <button type={type} title={title} aria-label={ariaLabel ?? title} className={cx(s.iconbtn, active && s.active, className)} style={mergedStyle} {...rest}>
      {node}
    </button>
  );
}
