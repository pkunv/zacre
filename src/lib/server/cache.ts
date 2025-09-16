type CacheEntry<T> = {
	value: T;
	timestamp: number;
};

export class Cache<T> {
	private cache: Map<string, CacheEntry<T>>;
	private ttl: number; // in milliseconds

	constructor(ttlHours: number = 4) {
		this.cache = new Map();
		this.ttl = ttlHours * 60 * 60 * 1000; // convert hours to milliseconds
	}

	set(key: string, value: T): void {
		this.cache.set(key, {
			value,
			timestamp: Date.now(),
		});
	}

	get(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		const isExpired = Date.now() - entry.timestamp > this.ttl;

		if (isExpired) {
			this.cache.delete(key);
			return null;
		}

		return entry.value;
	}

	clear(): void {
		this.cache.clear();
	}

	delete(key: string): void {
		this.cache.delete(key);
	}
}
