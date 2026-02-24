const helpers = {
    // Calculate word count from content
    calculateWordCount: (content) => {
        return content.trim().split(/\s+/).length;
    },

    // Calculate sections from content
    calculateSections: (content) => {
        return Math.max(1, content.split('\n\n').filter(s => s.trim()).length);
    },

    // Format date to ISO string
    formatDate: (date) => {
        return new Date(date).toISOString();
    },

    // Generate color from string (for consistent project colors)
    generateColorFromString: (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = Math.floor(Math.abs((Math.sin(hash) * 16777215) % 1) * 16777215).toString(16);
        return '#' + '0'.repeat(6 - color.length) + color;
    },

    // Calculate project progress percentage
    calculateProgress: (completed, total) => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    },

    // Group by date for analytics
    groupByDate: (items, dateField = 'date') => {
        return items.reduce((acc, item) => {
            const date = new Date(item[dateField]).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {});
    },

    // Calculate moving average
    movingAverage: (data, windowSize = 7) => {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const end = i + 1;
            const window = data.slice(start, end);
            const average = window.reduce((sum, val) => sum + val, 0) / window.length;
            result.push(average);
        }
        return result;
    },

    // Parse query parameters for filtering
    parseQueryParams: (query) => {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdDate',
            sortOrder = 'DESC',
            ...filters
        } = query;

        return {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder: sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
            filters
        };
    },

    // Build WHERE clause from filters
    buildWhereClause: (filters, allowedFields) => {
        const conditions = [];
        const values = [];

        for (const [key, value] of Object.entries(filters)) {
            if (allowedFields.includes(key) && value !== undefined && value !== '') {
                if (typeof value === 'string' && value.includes('%')) {
                    conditions.push(`${key} LIKE ?`);
                    values.push(value);
                } else {
                    conditions.push(`${key} = ?`);
                    values.push(value);
                }
            }
        }

        return {
            whereClause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
            values
        };
    }
};

module.exports = helpers;