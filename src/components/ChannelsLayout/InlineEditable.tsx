import { forwardRef, useImperativeHandle, useRef, ReactNode, useState, useEffect } from 'react';
import { Editable } from '@ark-ui/react/editable';
import { twMerge } from 'tailwind-merge';
import { cn } from '../../util/cn';

export interface InlineEditableHandle {
  startEdit: () => void;
}

export interface InlineEditableProps {
  value: string;
  onCommit: (value: string) => void | Promise<void>;
  edit?: boolean;
  onEditChange?: (editing: boolean) => void;
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
      edit,
      onEditChange,
      className,
      inputClassName,
      previewClassName,
      children,
    },
    ref
  ) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

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

    const handleCommit = (e: { value: string }) => {
      onCommit(e.value);
      onEditChange?.(false);
    };

    const handleValueChange = (e: { value: string }) => {
      setLocalValue(e.value);
    };

    const handleEditChange = (details: { edit: boolean }) => {
      onEditChange?.(details.edit);
    };

    const baseInputClasses = cn(
      'w-full',
      'min-w-0',
      'bg-transparent',
      'border-none',
      'outline-none',
      'focus:outline-none',
      'ring-0',
      'focus:ring-0',
      'px-0',
      'py-0',
      'font-inherit',
      'text-inherit',
      'text-current'
    );

    const basePreviewClasses = cn(
      'bg-transparent',
      'border-none',
      'outline-none',
      'cursor-pointer',
      'px-0',
      'py-0',
      'truncate'
    );

    return (
      <Editable.Root
        ref={editableRef}
        value={localValue}
        edit={edit}
        onEditChange={handleEditChange}
        onValueCommit={handleCommit}
        onValueChange={handleValueChange}
        activationMode="dblclick"
        submitMode="enter"
        selectOnFocus={true}
        className="min-w-0 flex-1"
      >
        <Editable.Area className={twMerge('min-w-0', className)}>
          <Editable.Input
            className={twMerge(baseInputClasses, inputClassName)}
          />
          <Editable.Preview className={twMerge(basePreviewClasses, previewClassName)}>
            {children || localValue}
          </Editable.Preview>
        </Editable.Area>
      </Editable.Root>
    );
  }
);

InlineEditable.displayName = 'InlineEditable';
