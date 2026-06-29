import { forwardRef, type SelectHTMLAttributes } from "react";
import { cx } from "@/lib/utils";
import s from "./Select.module.css";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cx(s.select, className)} {...rest}>
      {children}
    </select>
  );
});
