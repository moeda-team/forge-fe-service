"use client";
import { useState, useEffect, useRef } from "react";

export interface EditableTextProps {
  value: string;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onChange?(value: string): void;
  onSave?(value: string): void;
  onCancel?(): void;
  className?: string;
}

export default function EditableText({
  value,
  placeholder,
  multiline = false,
  autoFocus = true,
  maxLength,
  onChange,
  onSave,
  onCancel,
  className,
}: EditableTextProps) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      const end = inputRef.current.value.length;
      inputRef.current.setSelectionRange(end, end);
    }
  }, [autoFocus]);

  const emitSave = () => {
    onSave?.(text);
    onChange?.(text);
  };

  const emitCancel = () => {
    onCancel?.();
  };

  const input = (
    <input
      data-canvas-text-editor="true"
      ref={inputRef as React.RefObject<HTMLInputElement>}
      value={text}
      placeholder={placeholder}
      maxLength={maxLength}
      spellCheck={false}
      onMouseDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onChange={(e) => {
        setText(e.target.value);
        onChange?.(e.target.value);
      }}
      onBlur={emitSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          emitSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          emitCancel();
        } else if (e.key === "Tab") {
          e.preventDefault();
          emitSave();
        }
      }}
      className={[
        "w-full m-0 p-0 border-0 bg-transparent outline-none",
        "leading-[inherit] whitespace-pre resize-none overflow-hidden",
        "text-inherit caret-current",
        className || "",
      ].join(" ")}
    />
  );

  const textarea = (
    <textarea
      data-canvas-text-editor="true"
      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
      value={text}
      placeholder={placeholder}
      maxLength={maxLength}
      spellCheck={false}
      onMouseDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onChange={(e) => {
        setText(e.target.value);
        onChange?.(e.target.value);
      }}
      onBlur={emitSave}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          emitSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          emitCancel();
        } else if (e.key === "Tab") {
          e.preventDefault();
          emitSave();
        }
      }}
      className={[
        "w-full m-0 p-0 border-0 bg-transparent outline-none",
        "leading-[inherit] whitespace-pre resize-none overflow-hidden",
        "text-inherit caret-current",
        className || "",
      ].join(" ")}
    />
  );

  return multiline ? textarea : input;
}
