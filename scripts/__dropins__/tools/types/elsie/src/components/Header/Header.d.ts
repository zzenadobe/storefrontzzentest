import { FunctionComponent, VNode } from 'preact';
import { HTMLAttributes } from 'preact/compat';

export interface HeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'size'> {
    title: string;
    size?: 'medium' | 'large';
    divider?: boolean;
    cta?: VNode;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
}
export declare const Header: FunctionComponent<HeaderProps>;
//# sourceMappingURL=Header.d.ts.map