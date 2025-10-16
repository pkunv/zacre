export function safeRedirect(url: string) {
	setTimeout(() => {
		window.location.href = url;
	}, 650);
}

export type StandardResponse<T> = {
	status: "success" | "error";
	message?: string;
	item?: T;
	url?: string;
};

export function lockModuleButtons(element: HTMLElement) {
	const moduleButtons = element.querySelectorAll(
		"button, input[type='submit']",
	) as unknown as HTMLButtonElement[];
	if (moduleButtons) {
		moduleButtons.forEach((button) => {
			button.disabled = true;
			button.classList.add("btn-disabled");
			const loadingIcon = document.createElement("span");
			loadingIcon.classList.add("loading", "loading-spinner", "loading-md");
			button.appendChild(loadingIcon);
		});
	}
}

export function unlockModuleButtons(element: HTMLElement) {
	const moduleButtons = element.querySelectorAll(
		"button, input[type='submit']",
	) as unknown as HTMLButtonElement[];
	if (moduleButtons) {
		moduleButtons.forEach((button) => {
			button.disabled = false;
			button.classList.remove("btn-disabled");
			button.querySelector("span.loading")?.remove();
		});
	}
}
