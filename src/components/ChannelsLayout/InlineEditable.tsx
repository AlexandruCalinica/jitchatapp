import { forwardRef, useImperativeHandle, useRef, ReactNode } from 'react';
import { Editable } from '@ark-ui/react/editable';
import { twMerge } from 'tailwind-merge';
import { cn } from '../../util/cn';

export interface InlineEditableHandle {
  startEdit: () => void;
}

export interface InlineEditableProps {
  value: string;
  onCommit: (value: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
  previewClassName?: string;
  children?: ReactNode;
}

export const InlineEditable = forwardRef<InlineEditableHandle, InlineEditableProps>(
  (
    {
      value,
      onCommit,
      className,
      inputClassName,
      previewClassName,
      children,
    },
    ref
  ) => {
    const editableRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      startEdit: () => {
        if (editableRef.current) {
          const input = editableRef.current.querySelector('input');
          if (input) {
            input.focus();
          }
        }
      },
    }));

    const handleCommit = (details: { value: string }) => {
      onCommit(details.value);
    };

    const baseInputClasses = cn(
      'text-zed-fg',
      'bg-transparent',
      'border-none',
      'outline-none',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-orange-500',
      'px-0',
      'py-0',
      'font-inherit',
      'text-inherit'
    );

    const basePreviewClasses = cn(
      'text-zed-fg',
      'bg-transparent',
      'border-none',
      'outline-none',
      'cursor-text',
      'px-0',
      'py-0'
    );

    return (
      <Editable.Root
        ref={editableRef}
        value={value}
        onValueCommit={handleCommit}
        activationMode="dblclick"
        submitMode="both"
        selectOnFocus={true}
      >
        <Editable.Area className={className}>
          <Editable.Input
            className={twMerge(baseInputClasses, inputClassName)}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          />
          <Editable.Preview className={twMerge(basePreviewClasses, previewClassName)}>
            {children || value}
          </Editable.Preview>
        </Editable.Area>
      </Editable.Root>
    );
  }
);

InlineEditable.displayName = 'InlineEditable';
