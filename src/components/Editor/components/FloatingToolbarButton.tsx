import clsx from "clsx";

import { IconButton, IconButtonProps } from "../../IconButton/IconButton";

interface FloatingToolbarButtonProps extends IconButtonProps {
  active?: boolean;
}

export const FloatingToolbarButton = ({
  onClick,
  active,
  icon,
  ...rest
}: FloatingToolbarButtonProps) => {
  return (
    <IconButton
      {...rest}
      size="xs"
      icon={icon}
      variant="ghost"
      onClick={onClick}
      style={{ pointerEvents: "all" }}
      className={clsx(
        "rounded-sm text-zed-fg hover:bg-zed-active focus:bg-zed-active focus:text-zed-fg hover:text-zed-fg",
        {
          "bg-zed-active text-zed-fg": active,
        }
      )}
    />
  );
};
