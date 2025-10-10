type FormInput = {
	element: HTMLInputElement;
	isRequired: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
};

export function validateFormInputs({
	form,
	inputs,
}: {
	form: HTMLFormElement;
	inputs: FormInput[];
}) {
	const errors: string[] = [];
	let success = true;

	function returnError(input: FormInput, message: string) {
		errors.push(message);
		input.element.classList.add("border-error");
		const errorElement = document.createElement("p");
		errorElement.classList.add("label", "text-error", "form-validation-error");
		errorElement.textContent = message;
		input.element.parentNode?.insertBefore(errorElement, input.element.nextSibling);
		success = false;
	}

	inputs.forEach((input) => {
		if (input.isRequired && !input.element.value) {
			returnError(input, "This field is required");
		}
		if (input.minLength && input.element.value.length < input.minLength) {
			returnError(input, `This field must be at least ${input.minLength} characters long`);
		}
		if (input.maxLength && input.element.value.length > input.maxLength) {
			returnError(input, `This field must be at most ${input.maxLength} characters long`);
		}
		if (input.pattern && !input.element.value.match(input.pattern)) {
			returnError(input, "This field is invalid");
		}
	});

	if (success) {
		form.querySelectorAll(".form-validation-error").forEach((error) => {
			error.remove();
		});
		inputs.forEach((input) => {
			input.element.classList.remove("border-error");
		});
	}

	return success;
}
