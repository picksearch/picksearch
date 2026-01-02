export const sendResponse = (res, statusCode, success, dataOrError) => {
    const payload = {
        success
    };

    if (success) {
        payload.data = dataOrError;
    } else {
        payload.error = dataOrError;
    }

    return res.status(statusCode).json(payload);
};

export const sendError = (res, statusCode, errorCode, message, detail = null) => {
    return sendResponse(res, statusCode, false, {
        code: errorCode,
        message,
        detail
    });
};
