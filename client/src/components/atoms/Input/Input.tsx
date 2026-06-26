import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/utils";
import s from "./Input.module.css";

/** The shared text/search/password input. Mirrors the original base input. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, type = "text", ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cx(s.input, className)} {...rest} />;
});
