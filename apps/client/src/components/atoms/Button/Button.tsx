import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon, isIconName, type IconName } from "@/design/icons";
import { cx } from "@/lib/utils";
import s from "./Button.module.css";

export type ButtonVariant = "default" | "primary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: IconName | ReactNode;
}

/** The workspace's primary text button. Mirrors the original `.btn` family. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "md", icon, children, className, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx(s.btn, variant !== "default" && s[variant], size === "sm" && s.sm, className)} {...rest}>
      {icon != null && (isIconName(icon) ? <Icon name={icon} /> : icon)}
      {children != null && <span>{children}</span>}
    </button>
  );
});
