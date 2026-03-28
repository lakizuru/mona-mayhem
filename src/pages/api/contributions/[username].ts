import type { APIRoute } from 'astro';

export const prerender = false;

// Cache store for contributions data (in-memory, suitable for serverless)
const contributionCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Fetches GitHub contribution data for a user
 * Endpoint: GET /api/contributions/[username]
 *
 * Response format:
 * - On success: { contributions: [...], userName: string, updated: timestamp }
 * - On error: { error: string, status: number }
 */
export const GET: APIRoute = async ({ params }) => {
	const { username } = params;

	// Validate username parameter
	if (!username || typeof username !== 'string') {
		return new Response(
			JSON.stringify({ error: 'Username parameter is required' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	// Check cache
	const cached = contributionCache.get(username);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return new Response(JSON.stringify(cached.data), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	}

	try {
		// Fetch contribution data from GitHub using public contributions endpoint
		const contributionsUrl = `https://github.com/users/${encodeURIComponent(username)}/contributions`;

		const response = await fetch(contributionsUrl, {
			headers: {
				'User-Agent': 'Mona-Mayhem-App',
				Accept:
					'application/vnd.github.v3+json, text/html;q=0.9, */*;q=0.8',
			},
		});

		// If GitHub returns rate limit or server errors, return appropriate response
		if (response.status === 429) {
			return new Response(
				JSON.stringify({
					error: 'GitHub API rate limit exceeded. Please try again later.',
					retryAfter: response.headers.get('Retry-After'),
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': response.headers.get('Retry-After') || '60',
					},
				}
			);
		}

		if (response.status === 404) {
			return new Response(
				JSON.stringify({
					error: `User "${username}" not found on GitHub`,
				}),
				{
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		if (!response.ok) {
			return new Response(
				JSON.stringify({
					error: `Failed to fetch data from GitHub (status: ${response.status})`,
				}),
				{
					status: 502,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Parse the HTML response and extract contribution data from table cells
		const html = await response.text();

		// Extract contribution data from table cells with data-date and data-level
		// Pattern: <td ... data-date="YYYY-MM-DD" ... data-level="N" ...>
		const cellPatt =
			/<td[^>]*data-date="([^"]+)"[^>]*data-level="(\d+)"[^>]*>/g;
		const contributions: Array<{ date: string; level: number }> = [];
		let match;

		// Rewind the regex cursor
		cellPatt.lastIndex = 0;

		while ((match = cellPatt.exec(html)) !== null) {
			contributions.push({
				date: match[1],
				level: parseInt(match[2], 10),
			});
		}

		// If no contributions found, try alternate pattern (data-level before data-date)
		if (contributions.length === 0) {
			const altPattern =
				/<td[^>]*data-level="(\d+)"[^>]*data-date="([^"]+)"[^>]*>/g;
			altPattern.lastIndex = 0;

			while ((match = altPattern.exec(html)) !== null) {
				contributions.push({
					date: match[2],
					level: parseInt(match[1], 10),
				});
			}
		}

		// Get total contributions from the page header (e.g., "123 contributions")
		let totalContributions = 0;
		const totalMatch = html.match(
			/(\d+(?:,\d+)*)\s+contributions?\s+in\s+the\s+last\s+year/i
		);
		if (totalMatch) {
			totalContributions = parseInt(
				totalMatch[1].replace(/,/g, ''),
				10
			);
		}

		// Prepare response data
		const responseData = {
			userName: username,
			contributions: contributions,
			updated: new Date().toISOString(),
			totalContributions: totalContributions,
		};

		// Cache the result
		contributionCache.set(username, {
			data: responseData,
			timestamp: Date.now(),
		});

		return new Response(JSON.stringify(responseData), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	} catch (error) {
		console.error(`Error fetching contributions for ${username}:`, error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error while fetching GitHub data',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
