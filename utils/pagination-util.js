const log = require('./logger');

module.exports = {
    pagination: async(countPages,data_count,perPage,page,minPage,maxPage,lastElem,isPaginationShow) => {
        log.info(`Start function pagination. DATA: ${JSON.stringify({countPages,data_count,perPage,page,minPage,maxPage,lastElem,isPaginationShow})}`);
        lastElem = true;
        countPages = Math.ceil(data_count / perPage);

        if (page >= 2) {
            minPage = page - 1;
            if (countPages === page) minPage = page - 1;
            if (page === 3 && countPages === page) minPage = 1;
        } else {
            minPage = page;
        };

        if (page >= 2 && page + 2 <= countPages) {
            maxPage = page + 1;
        } else {
            maxPage = page + 1;
            if (page === 1 && countPages > 2) maxPage = page + 1;
        };

        if (page === countPages) {lastElem = false;}
        if (minPage < 1) minPage = 1;
        if (countPages < 2) isPaginationShow = false;

        log.info(`End function pagination. DATA: ${JSON.stringify({pagination : { page:page, max: maxPage, min: minPage, lastElem:lastElem},isPaginationShow,countPages })}`);
        return ({pagination : { page:page, max: maxPage, min: minPage, lastElem:lastElem},isPaginationShow,countPages })
    }
}
