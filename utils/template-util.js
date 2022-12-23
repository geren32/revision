const handlebars = require('handlebars');
const helpers = require('./handebar-helpers');
handlebars.registerHelper(helpers);
const fs = require('fs');
const log = require('./logger');

module.exports = {

    // generate template
    getTemplate: async(data, type) => {
        log.info(`Start function getTemplate. DATA: ${JSON.stringify({data, type})}`);
        let file = await fs.readFileSync(`views/${type}.hbs`);
        let source = file.toString();
        let template = handlebars.compile(source);
        log.info(`End function getTemplate. DATA: ${JSON.stringify(true)}`);
        return await template(data);
    }


}
