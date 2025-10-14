import { VNode } from "preact";
import { JSX } from "preact/jsx-runtime";

export function Card({
	children,
	className,
	...props
}: {
	children: JSX.Element | string | VNode | VNode[];
	className?: string;
	props?: JSX.HTMLAttributes<HTMLDivElement>;
}) {
	return (
		<div {...props} class={`card bg-base-100 shadow-sm ${className}`}>
			{children}
		</div>
	);
}

export function CardTitle({
	children,
	className,
	...props
}: {
	children: JSX.Element | string | VNode;
	className?: string;
	props?: JSX.HTMLAttributes<HTMLDivElement>;
}) {
	return (
		<h2 {...props} class={`card-title ${className}`}>
			{children}
		</h2>
	);
}

export function CardBody({
	children,
	className,
	...props
}: {
	children: JSX.Element | string | VNode | VNode[];
	className?: string;
	props?: JSX.HTMLAttributes<HTMLDivElement>;
}) {
	return (
		<div {...props} class={`card-body ${className}`}>
			{children}
		</div>
	);
}

export function CardFooter({
	children,
	className,
	...props
}: {
	children: JSX.Element | string | VNode;
	className?: string;
	props?: JSX.HTMLAttributes<HTMLDivElement>;
}) {
	return (
		<div {...props} class={`card-actions justify-end ${className}`}>
			{children}
		</div>
	);
}
