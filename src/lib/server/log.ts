import { RouterRequest } from "@/lib/server/typed-router";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { NextFunction, Response } from "ultimate-express";

export function getLocalISOString() {
	return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString();
}

const getDurationInMilliseconds = (start: [number, number]) => {
	const NS_PER_SEC = 1e9;
	const NS_TO_MS = 1e6;
	const diff = process.hrtime(start);
	return Math.round((diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS);
};

/**
 * Write log to file with current date as filename
 * @param logMessage The log message to write
 */
const writeLogToFile = (logMessage: string) => {
	try {
		const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
		const logsDir = join(process.cwd(), "out", "logs");
		const logFilePath = join(logsDir, `${currentDate}.txt`);

		// Create directory structure if it doesn't exist
		if (!existsSync(logsDir)) {
			mkdirSync(logsDir, { recursive: true });
		}

		// Append log message to file with timestamp
		const timestamp = new Date().toISOString();
		const logEntry = `[${timestamp}] ${logMessage}\n`;

		// Use append mode by checking if file exists
		if (existsSync(logFilePath)) {
			writeFileSync(logFilePath, logEntry, { flag: "a" });
		} else {
			writeFileSync(logFilePath, logEntry);
		}
	} catch (error) {
		// Fallback to console if file writing fails
		console.error("Failed to write log to file:", error);
	}
};

/**
 * Logging middleware
 * @param req
 * @param res
 * @param next
 */
export const serverLog = (req: RouterRequest, res: Response, next: NextFunction) => {
	const start = process.hrtime();
	res.on("finish", function () {
		if (req.method === "OPTIONS") return;
		const log = [
			getLocalISOString(),
			req.auth?.user.name ? `[${req.auth.user.name}]` : `[SERVER]`,
			`[${req.method}]`,
			(() => {
				const url = decodeURI(req.url);
				return url.length > 64 ? url.slice(0, 64) + "..." : url;
			})(),
			res.statusCode,
			`${getDurationInMilliseconds(start).toLocaleString()}ms`,
		];
		const logMessage = log.join(" ");
		console.log(...log);

		// Write to file
		writeLogToFile(logMessage);

		const postData = req.body;
		if (req.method !== "GET" && req.method !== "OPTIONS" && postData) {
			const postDataLog = JSON.stringify(postData, null, 2);
			console.log(postDataLog);
			writeLogToFile(`POST Data: ${postDataLog}`);
		}
	});
	next();
};

export const logMessage = ({
	functionName,
	message,
	appendToLogFile = true,
}: {
	functionName: string;
	message: string;
	appendToLogFile?: boolean;
}) => {
	const log = [getLocalISOString(), `[${functionName}]`, message];
	console.log(...log);
	if (appendToLogFile) {
		writeLogToFile(log.join(" "));
	}
	return log;
};
