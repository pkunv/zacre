import { JSX } from "preact/jsx-runtime";

export function H1({
	children,
	...props
}: {
	children: JSX.Element | string;
	props?: JSX.HTMLAttributes<HTMLHeadingElement>;
}) {
	return (
		<h1
			{...props}
			class="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance"
		>
			{children}
		</h1>
	);
}

export function H2({
	children,
	...props
}: {
	children: JSX.Element | string;
	props?: JSX.HTMLAttributes<HTMLHeadingElement>;
}) {
	return (
		<h2 {...props} class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
			{children}
		</h2>
	);
}

export function H3({
	children,
	...props
}: {
	children: JSX.Element | string;
	props?: JSX.HTMLAttributes<HTMLHeadingElement>;
}) {
	return (
		<h3 {...props} class="scroll-m-20 text-2xl font-semibold tracking-tight">
			{children}
		</h3>
	);
}

export function H4({
	children,
	...props
}: {
	children: JSX.Element | string;
	props?: JSX.HTMLAttributes<HTMLHeadingElement>;
}) {
	return (
		<h4 {...props} class="scroll-m-20 text-xl font-semibold tracking-tight">
			{children}
		</h4>
	);
}

export function P({
	children,
	...props
}: {
	children: JSX.Element | string | (JSX.Element | string)[];
} & JSX.IntrinsicElements["p"]) {
	return (
		<p {...props} class="leading-7 [&:not(:first-child)]:mt-6">
			{children}
		</p>
	);
}

export function Blockquote({
	children,
	...props
}: {
	children: JSX.Element | string;
	props?: JSX.HTMLAttributes<HTMLQuoteElement>;
}) {
	return (
		<blockquote {...props} class="mt-6 border-l-2 pl-6 italic">
			{children}
		</blockquote>
	);
}
