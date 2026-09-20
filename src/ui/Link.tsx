/** Internal link: a real `<a href>` (so crawlers and new-tab clicks work) that navigates without a reload on a normal click. */
import type { AnchorHTMLAttributes } from 'react';
import { onLinkClick } from '../core/routes';

/**
 * @param props - anchor props; `href` must be an internal path
 */
export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        onLinkClick(e, href);
      }}
    />
  );
}
