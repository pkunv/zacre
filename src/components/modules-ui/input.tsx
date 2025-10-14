import { JSX } from "preact/jsx-runtime";

export function Input({
	label,
	icon,
	sizeOption,
	className,
	required,
	...inputProps
}: {
	label?: string;
	icon?: string;
	sizeOption: "xs" | "sm" | "md" | "lg" | "xl";
	className?: string;
} & JSX.IntrinsicElements["input"]) {
	const InputWithLabelAndIcon = () => {
		return (
			<fieldset class="fieldset">
				<legend class="fieldset-legend">{label}</legend>
				<label class="input">
					<i data-lucide={icon} class="w-4 h-4 opacity-50" />
					<input
						{...inputProps}
						required={required}
						class={`input input-${sizeOption} ${className}`}
					/>
				</label>
				<p class="label">{!required ? "Optional" : "Required"}</p>
			</fieldset>
		);
	};
	const InputWithLabel = () => {
		return (
			<fieldset class="fieldset">
				<legend class="fieldset-legend">{label}</legend>
				<input
					{...inputProps}
					required={required}
					class={`input input-${sizeOption} ${className}`}
				/>
				<p class="label">{!required ? "Optional" : "Required"}</p>
			</fieldset>
		);
	};
	const InputWithIcon = () => {
		return (
			<label class="input">
				<i data-lucide={icon} class="w-4 h-4 opacity-50" />
				<input
					{...inputProps}
					required={required}
					class={`input input-${sizeOption} ${className}`}
				/>
			</label>
		);
	};

	return label && icon ? (
		<InputWithLabelAndIcon />
	) : label ? (
		<InputWithLabel />
	) : icon ? (
		<InputWithIcon />
	) : (
		<input {...inputProps} required={required} class={`input input-${sizeOption} ${className}`} />
	);
}
