const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // MySQL duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            error: 'Conflict',
            message: 'Duplicate entry',
            statusCode: 409,
            details: err.sqlMessage
        });
    }

    // MySQL foreign key constraint error
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Referenced record does not exist',
            statusCode: 400,
            details: err.sqlMessage
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong',
        statusCode: err.status || 500,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;