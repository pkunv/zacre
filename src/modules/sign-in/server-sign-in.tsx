import { configParameterCache } from "@/lib/server/parameter";
import { ParameterDefinition, ServerModule } from "@/modules/server";

export const signInParameters = [
	{ key: "isSignUpEnabled" },
] as const satisfies readonly ParameterDefinition<string>[];

export type SignInData = {
	modulesCount: number;
};

export const serverSignIn: ServerModule<typeof signInParameters, unknown> = {
	shortName: "sign-in",
	name: "Sign In",
	description: "Module that allows to authorize and access client panel, admin panel and more.",
	parameters: signInParameters,
	createdAt: new Date("2025-09-17"),
	render: async ({ element }) => {
		return (
			<div
				class="w-full h-dvh bg-base-100 flex flex-col justify-center items-center gap-4"
				data-module="sign-in"
				data-element-id={element.id}
			>
				<a href="/">
					<img
						src={configParameterCache.get("website.logo")?.value}
						alt="Logo"
						class="w-full h-fit object-scale-down max-w-48"
					/>
				</a>

				<form class="card bg-base-100 w-full max-w-sm shadow-sm card-lg p-4">
					<div class="card-body">
						<h2 class="card-title">Sign In</h2>
						<label className="input">
							<i data-lucide="at-sign" className="w-[1em] h-[1em] opacity-50" />
							<input type="text" className="grow" name="email" placeholder="Email" />
						</label>
						<label className="input">
							<i data-lucide="lock" className="w-[1em] h-[1em] opacity-50" />
							<input type="password" className="grow" name="password" placeholder="Password" />
						</label>
					</div>
					<div class="card-actions justify-end">
						<button type="submit" className="btn btn-primary">
							Sign In
						</button>
					</div>
				</form>
			</div>
		);
	},
};
