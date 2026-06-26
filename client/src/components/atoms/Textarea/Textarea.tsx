import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/utils";
import s from "./Textarea.module.css";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cx(s.textarea, className)} {...rest} />;
});
