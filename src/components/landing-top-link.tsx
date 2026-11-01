"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

interface LandingTopLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  children: ReactNode;
}

export function LandingTopLink({
  children,
  onClick,
  ...props
}: LandingTopLinkProps) {
  return (
    <a
      href="#top"
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
    >
      {children}
    </a>
  );
}
