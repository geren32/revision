const jsonFile = require("edit-json-file");
const config = require('../configs/config');
const languages = config.LANGUAGES;
const log = require('../utils/logger');
module.exports = {
    editLocalisation: async (req, res) => {
        let textArray = req.body;
        log.info(`Start /editLocalisation Params: ${JSON.stringify(req.body)}`);
        for (let textInner of textArray)
        {
            let file = jsonFile(`./localisation/text_${textInner.lang}.json`);
            for (let text of textInner.text){
                file.set(text.name, text.value);
            }
            file.save();
        }
        log.info(`End  Result: ${JSON.stringify(textArray)}`);
        return   res.status(200).json(textArray);
    },
    getLocalisation: async (req, res) => {
        let result = [];
        log.info(`Start /getLocalisation  `);
        for (let i = 0 ; i < languages.length; i++) {
            let file = jsonFile(`./localisation/text_${languages[i]}.json`);
            let text = file.get()
            result.push({
                lang:languages[i],
                text:text
            })

        }
        log.info(`End  Result: ${JSON.stringify(result)}`);
        return   res.status(200).json(result);
    }
}