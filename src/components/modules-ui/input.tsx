import { JSX } from "preact/jsx-runtime";

export function Input({
	label,
	icon,
	sizeOption = "md",
	className = "",
	required,
	...inputProps
}: {
	label?: string;
	icon?: string;
	sizeOption?: "xs" | "sm" | "md" | "lg" | "xl";
	className?: string;
} & JSX.IntrinsicElements["input"]) {
	const InputComponent = () => {
		return (
			<input
				{...inputProps}
				required={required}
				type={inputProps.type || "text"}
				class={`${inputProps.type === "checkbox" ? "checkbox" : "input"} input-${sizeOption || "md"} ${className}`}
			/>
		);
	};

	const InputWithLabelAndIcon = () => {
		return (
			<fieldset class="fieldset">
				<legend class="fieldset-legend">{label}</legend>
				<label class="input">
					<i data-lucide={icon} class="w-4 h-4 opacity-50" />
					<InputComponent />
				</label>
				{required && <p class="label">Required</p>}
			</fieldset>
		);
	};
	const InputWithLabel = () => {
		return (
			<fieldset class="fieldset">
				<legend class="fieldset-legend">{label}</legend>
				<InputComponent />
				{required && <p class="label">Required</p>}
			</fieldset>
		);
	};
	const InputWithIcon = () => {
		return (
			<fieldset class="fieldset">
				<label class="input">
					<i data-lucide={icon} class="w-4 h-4 opacity-50" />
					<InputComponent />
				</label>
				{required && <p class="label">Required</p>}
			</fieldset>
		);
	};

	return label && icon ? (
		<InputWithLabelAndIcon />
	) : label ? (
		<InputWithLabel />
	) : icon ? (
		<InputWithIcon />
	) : (
		<InputComponent />
	);
}
