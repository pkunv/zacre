class ToastManager {
	private container: HTMLDivElement | null = null;
	private toasts: HTMLDivElement[] = [];
	private readonly maxToasts = 3;
	private readonly defaultDuration = 7500;

	constructor() {
		this.initializeContainer();
	}

	private initializeContainer() {
		this.container = document.createElement("div");
		this.container.className = "toast toast-end fixed bottom-4 right-4 z-50";
		document.body.appendChild(this.container);
	}

	private createToast(message: string, type: "success" | "error" | "info", duration: number) {
		if (!this.container) return;

		const toast = document.createElement("div");
		toast.className = `alert ${this.getAlertClass(type)}`;
		toast.innerHTML = `
            <span>${message}</span>
            <button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()">✕</button>
        `;

		this.container.appendChild(toast);
		this.toasts.push(toast);

		// Remove oldest toast if we exceed maxToasts
		if (this.toasts.length > this.maxToasts) {
			const oldestToast = this.toasts.shift();
			if (oldestToast) {
				oldestToast.remove();
			}
		}

		// Auto remove after duration
		setTimeout(() => {
			toast.remove();
			this.toasts = this.toasts.filter((t) => t !== toast);
		}, duration);
	}

	private getAlertClass(type: "success" | "error" | "info"): string {
		switch (type) {
			case "success":
				return "alert-success";
			case "error":
				return "alert-error";
			case "info":
				return "alert-info";
		}
	}

	success(message: string, duration: number = this.defaultDuration) {
		this.createToast(message, "success", duration);
	}

	error(message: string, duration: number = this.defaultDuration) {
		this.createToast(message, "error", duration);
	}

	info(message: string, duration: number = this.defaultDuration) {
		this.createToast(message, "info", duration);
	}
}

export const toast = new ToastManager();
