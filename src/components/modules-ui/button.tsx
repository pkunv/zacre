import { JSX } from "preact/jsx-runtime";

export function Button({
	sizeOption,
	asLink,
	href,
	iconName,
	children,
	className,
	...props
}: {
	sizeOption: "xs" | "sm" | "md" | "lg";
	asLink?: boolean;
	href?: string;
	iconName?: string;
	children?: JSX.Element | JSX.Element[] | string;
	className?: string;
} & (JSX.IntrinsicElements["button"] | JSX.IntrinsicElements["a"])) {
	const content = (
		<>
			{iconName && <i data-lucide={iconName} class="w-4 h-4" />}
			{children}
		</>
	);

	const classes = `btn btn-${sizeOption} ${className || ""}`;

	if (asLink && href) {
		return (
			<a {...(props as JSX.IntrinsicElements["a"])} href={href} class={classes}>
				{content}
			</a>
		);
	}

	return (
		<button {...(props as JSX.IntrinsicElements["button"])} class={classes}>
			{content}
		</button>
	);
}
