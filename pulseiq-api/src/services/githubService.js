const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

class GitHubService {
    static parseRepo(repoInput) {
        if (!repoInput || typeof repoInput !== 'string') {
            throw new Error('git_repo is required and must be a string');
        }

        const trimmed = repoInput.trim();
        const shorthandMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
        if (shorthandMatch) {
            return { owner: shorthandMatch[1], repo: shorthandMatch[2] };
        }

        let url;
        try {
            url = new URL(trimmed);
        } catch (e) {
            throw new Error('git_repo must be a valid GitHub URL or owner/repo');
        }

        if (url.hostname !== 'github.com') {
            throw new Error('git_repo must point to github.com');
        }

        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 2) {
            throw new Error('git_repo must include owner and repo name');
        }

        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/i, '');
        return { owner, repo };
    }

    static getHeaders() {
        const headers = {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'pulseiq-api'
        };

        if (GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
        }

        return headers;
    }

    static async requestWithMeta(path, query = {}) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null) {
                params.set(key, String(value));
            }
        }

        const url = `${GITHUB_API_BASE}${path}${params.toString() ? `?${params}` : ''}`;
        let resp;
        try {
            resp = await fetch(url, { headers: this.getHeaders() });
        } catch (err) {
            const causeCode = err?.cause?.code ? ` (${err.cause.code})` : '';
            const causeMessage = err?.cause?.message ? `: ${err.cause.message}` : '';
            const error = new Error(`GitHub API network request failed${causeCode}${causeMessage}`);
            error.statusCode = 502;
            error.status = 502;
            throw error;
        }

        if (!resp.ok) {
            const text = await resp.text();
            const error = new Error(`GitHub API request failed (${resp.status}): ${text}`);
            error.statusCode = resp.status;
            error.status = resp.status;
            throw error;
        }

        return {
            data: await resp.json(),
            headers: resp.headers
        };
    }

    static async request(path, query = {}) {
        const { data } = await this.requestWithMeta(path, query);
        return data;
    }

    static async requestJson(method, path, body = undefined) {
        const url = `${GITHUB_API_BASE}${path}`;
        const headers = this.getHeaders();
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        let resp;
        try {
            resp = await fetch(url, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined
            });
        } catch (err) {
            const causeCode = err?.cause?.code ? ` (${err.cause.code})` : '';
            const causeMessage = err?.cause?.message ? `: ${err.cause.message}` : '';
            const error = new Error(`GitHub API network request failed${causeCode}${causeMessage}`);
            error.statusCode = 502;
            error.status = 502;
            throw error;
        }

        if (!resp.ok) {
            const text = await resp.text();
            const error = new Error(`GitHub API request failed (${resp.status}): ${text}`);
            error.statusCode = resp.status;
            error.status = resp.status;
            throw error;
        }

        return resp.status === 204 ? null : await resp.json();
    }

    static buildIssueLabels(issueData = {}) {
        const labels = ['source:pulseiq'];

        if (issueData.priority) {
            labels.push(`priority:${String(issueData.priority).toLowerCase()}`);
        }

        if (issueData.status) {
            labels.push(`status:${String(issueData.status).toLowerCase()}`);
        }

        return labels;
    }

    static async createIssue(repoInput, issueData) {
        if (!GITHUB_TOKEN) {
            const error = new Error('GITHUB_TOKEN is not configured');
            error.statusCode = 400;
            error.status = 400;
            throw error;
        }

        if (!issueData?.title || typeof issueData.title !== 'string' || issueData.title.trim() === '') {
            const error = new Error('Issue title is required to create a GitHub issue');
            error.statusCode = 400;
            error.status = 400;
            throw error;
        }

        const { owner, repo } = this.parseRepo(repoInput);
        const payload = {
            title: issueData.title.trim(),
            body: issueData.description ? String(issueData.description) : '',
            labels: this.buildIssueLabels(issueData)
        };

        return this.requestJson('POST', `/repos/${owner}/${repo}/issues`, payload);
    }

    static extractLastPage(linkHeader) {
        if (!linkHeader || typeof linkHeader !== 'string') {
            return null;
        }

        const segments = linkHeader.split(',').map(segment => segment.trim());
        const lastSegment = segments.find(segment => segment.includes('rel="last"'));
        if (!lastSegment) {
            return null;
        }

        const match = lastSegment.match(/[?&]page=(\d+)/);
        if (!match) {
            return null;
        }

        const page = Number(match[1]);
        return Number.isInteger(page) && page > 0 ? page : null;
    }

    static async getTotalCountByLink(path, query = {}) {
        const { data, headers } = await this.requestWithMeta(path, {
            ...query,
            per_page: 1,
            page: 1
        });

        const lastPage = this.extractLastPage(headers.get('link'));
        if (lastPage !== null) {
            return lastPage;
        }

        return Array.isArray(data) ? data.length : 0;
    }

    static startOfUtcDay(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }

    static dateKey(date) {
        return date.toISOString().slice(0, 10);
    }

    static weekdayIndexMondayFirst(date) {
        const day = date.getUTCDay(); // 0 Sun - 6 Sat
        return day === 0 ? 6 : day - 1;
    }

    static normalizeLanguagePercentages(languageBytes) {
        if (!languageBytes || typeof languageBytes !== 'object') {
            return {};
        }

        const entries = Object.entries(languageBytes)
            .map(([language, value]) => [language, Number(value)])
            .filter(([, value]) => Number.isFinite(value) && value > 0);

        if (entries.length === 0) {
            return {};
        }

        const total = entries.reduce((sum, [, value]) => sum + value, 0);
        if (total <= 0) {
            return {};
        }

        let largestIndex = 0;
        for (let i = 1; i < entries.length; i++) {
            if (entries[i][1] > entries[largestIndex][1]) {
                largestIndex = i;
            }
        }

        const percentages = entries.map(([language, value]) => ({
            language,
            percent: Number(((value / total) * 100).toFixed(2))
        }));

        const roundedTotal = percentages.reduce((sum, item) => sum + item.percent, 0);
        const delta = Number((100 - roundedTotal).toFixed(2));
        if (delta !== 0) {
            percentages[largestIndex].percent = Number((percentages[largestIndex].percent + delta).toFixed(2));
        }

        return percentages.reduce((result, item) => {
            result[item.language] = item.percent;
            return result;
        }, {});
    }

    static async fetchRepositoryMetrics(repoInput) {
        const { owner, repo } = this.parseRepo(repoInput);

        const [languages, pullRequests, commits] = await Promise.all([
            this.request(`/repos/${owner}/${repo}/languages`),
            this.getTotalCountByLink(`/repos/${owner}/${repo}/pulls`, { state: 'all' }),
            this.getTotalCountByLink(`/repos/${owner}/${repo}/commits`)
        ]);

        const pulls = await this.request(`/repos/${owner}/${repo}/pulls`, { state: 'all', per_page: 100, page: 1 });
        const mergedPRs = pulls.filter(pr => pr.merged_at).length;

        let codeReviews = 0;
        const reviewCandidates = pulls.slice(0, 20);
        for (const pr of reviewCandidates) {
            try {
                const reviews = await this.request(`/repos/${owner}/${repo}/pulls/${pr.number}/reviews`, { per_page: 100, page: 1 });
                codeReviews += Array.isArray(reviews) ? reviews.length : 0;
            } catch (e) {
                // Continue even if one PR review list fails.
            }
        }

        const now = new Date();
        const today = this.startOfUtcDay(now);
        const start = new Date(today);
        start.setUTCDate(start.getUTCDate() - 14);

        const recentCommits = await this.request(`/repos/${owner}/${repo}/commits`, {
            since: start.toISOString(),
            per_page: 100,
            page: 1
        });

        const commitMessages = Array.isArray(recentCommits)
            ? recentCommits
                .map(commit => commit?.commit?.message)
                .filter(message => typeof message === 'string' && message.trim() !== '')
                .map(message => message.split('\n')[0])
                .slice(0, 10)
            : [];

        const commitsByDay = [0, 0, 0, 0, 0, 0, 0];
        const trendMap = {};
        for (let i = 0; i < 15; i++) {
            const d = new Date(start);
            d.setUTCDate(start.getUTCDate() + i);
            trendMap[this.dateKey(d)] = 0;
        }

        if (Array.isArray(recentCommits)) {
            for (const commit of recentCommits) {
                const commitDateString = commit?.commit?.author?.date || commit?.commit?.committer?.date;
                if (!commitDateString) {
                    continue;
                }

                const commitDate = new Date(commitDateString);
                if (Number.isNaN(commitDate.getTime())) {
                    continue;
                }

                const commitDay = this.startOfUtcDay(commitDate);
                if (commitDay < start || commitDay > today) {
                    continue;
                }

                const key = this.dateKey(commitDay);
                if (trendMap[key] !== undefined) {
                    trendMap[key] += 1;
                }
                commitsByDay[this.weekdayIndexMondayFirst(commitDay)] += 1;
            }
        }

        const commitTrend = Object.keys(trendMap)
            .sort()
            .map(date => ({ date, commitCount: trendMap[date] }));

        return {
            commits,
            pullRequests,
            mergedPRs,
            codeReviews,
            languages: this.normalizeLanguagePercentages(languages),
            commitMessages,
            commitsByDay,
            commitTrend
        };
    }
}

module.exports = GitHubService;
