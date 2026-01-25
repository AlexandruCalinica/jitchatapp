import React from 'react';

import { twMerge } from 'tailwind-merge';
import { Tooltip as ArkTooltip } from '@ark-ui/react/tooltip';

export interface TooltipProps {
  open?: boolean;
  tabIndex?: number;
  className?: string;
  hasArrow?: boolean;
  defaultOpen?: boolean;
  delayDuration?: number;
  label: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({
  side = 'top',
  open,
  label,
  align = 'center',
  children,
  hasArrow,
  className,
  defaultOpen,
  onOpenChange,
  delayDuration = 500,
}: TooltipProps) => {
  if (!label) return children;

  const getPlacement = () => {
    if (align === 'center') return side;
    return `${side}-${align}` as const;
  };

  return (
    <ArkTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      openDelay={delayDuration}
      positioning={{
        placement: getPlacement(),
        offset: { mainAxis: 5 },
      }}
      lazyMount
      unmountOnExit
    >
      <ArkTooltip.Trigger asChild>
        {children}
      </ArkTooltip.Trigger>
      <ArkTooltip.Positioner>
        <ArkTooltip.Content
          className={twMerge(
            'z-[5000] text-zed-bg select-none rounded-[4px] bg-zed-fg px-[8px] py-[4px] text-[12px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]',
            className
          )}
        >
          {label}
          {hasArrow && (
            <ArkTooltip.Arrow>
              <ArkTooltip.ArrowTip className="fill-zed-fg" />
            </ArkTooltip.Arrow>
          )}
        </ArkTooltip.Content>
      </ArkTooltip.Positioner>
    </ArkTooltip.Root>
  );
};
