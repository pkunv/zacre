import { getConfigParameters } from "@/lib/server/parameter";
import { RouterRequest } from "@/lib/server/typed-router";
import { getClientBundleFilename } from "@/lib/server/utils";
import { JSX } from "preact/jsx-runtime";

export async function Root({
	req,
	children,
}: {
	req: RouterRequest;
	children: JSX.Element | JSX.Element[];
}) {
	const clientBundleFilename = getClientBundleFilename();

	const configParameters = await getConfigParameters();

	return (
		<html data-theme={configParameters["website.theme"].value} lang="en">
			<head>
				<title>{configParameters["website.name"].value}</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="icon" href={configParameters["website.favicon"].value} />
				<script src={clientBundleFilename} defer />
				<meta name="description" content={configParameters["website.description"].value} />
				<meta name="keywords" content={configParameters["website.keywords"].value} />
				<meta name="author" content={configParameters["website.author"].value} />
				<link rel="stylesheet" href="/style.css" />
			</head>
			<body class="flex w-screen max-w-full min-h-screen flex-col gap-4">{children}</body>
		</html>
	);
}
