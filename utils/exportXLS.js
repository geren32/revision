const ExcelJS = require('exceljs');
const config = require('../configs/config');
const log = require('./logger');
const path = require('path')
const moment = require('moment')
module.exports = {

    exportXlsCategoryProducts: async(catProducts, lang, category_title, current_time) => {
        log.info(`Start function exportXlsCategoryProducts`);
        let workbook = new ExcelJS.Workbook();
        let sheet = workbook.addWorksheet(`${category_title}`);
        let worksheet = workbook.getWorksheet(`${category_title}`);

        try {
            current_time = moment(current_time).format('HH:mm DD.MM.YYYY');

            const imageId = workbook.addImage({ filename: path.join('public', 'img', 'black_logo_original.png'), extension: 'png' })
            worksheet.addImage(imageId, {
                tl: { col: 1, row: 1 },
                br: { col: 2, row: 6 },
                ext: { width: 800, height: 370 },
                editAs: 'oneCell'
            })

            worksheet.columns = [
                { header: '№', key: 'order_number', width: 5 },
                { header: config.TEXTS[lang].model_exel_text, key: 'name', width: 40 },
                { header: config.TEXTS[lang].standart_sizes_exel_text, key: 'dimension', width: 30 },
                { header: config.TEXTS[lang].prises_exel_text, key: 'price', width: 25 },
                { header: config.TEXTS[lang].retail_prises_exel_text, key: 'retail_price', width: 25 },

            ];

            for (let j = 0; j < catProducts.length; j++) {
                let catProduct = catProducts[j];

                worksheet.addRow({
                    order_number: catProduct.order_number ? catProduct.order_number : '',
                    name: catProduct.name ? catProduct.name : '',
                    dimension: catProduct.dimension ? catProduct.dimension : '',
                    price: catProduct.price ? catProduct.price : '',
                    retail_price: catProduct.retail_price ? catProduct.retail_price : '',
                });
            }

            worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
                if (rowNumber == 1) {
                    row.eachCell(function(cell, colNumber) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };

                        cell.font = {
                            bold: true,
                        };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        }
                    });
                } else {
                    row.eachCell(function(cell, colNumber) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        }
                    });
                }

            });

            worksheet.duplicateRow(1, 7, true);
            worksheet.getRow(1).values = []
            worksheet.getRow(2).values = []
            worksheet.getRow(3).values = []
            worksheet.getRow(4).values = []
            worksheet.getRow(5).values = []
            worksheet.getRow(6).values = []
            worksheet.getRow(7).values = []

            worksheet.mergeCells('A1', 'E7');
            worksheet.getRow(1).values = [`${category_title} ${config.TEXTS[lang].from} ${current_time}`]
            worksheet.getRow(1).alignment = { vertical: 'bottom', horizontal: 'right' };
            worksheet.getRow(8).height = 25;

            // write to a new buffer
            workbook = await workbook.xlsx.writeBuffer();
            log.info(`End function exportXlsCategoryProducts.`);
            return workbook;
        } catch (err) {
            console.log(err)
            log.error(`${err}`);
        }

    },
    exportXlClients : async  (clients) =>{
        let file = new ExcelJS.Workbook();
        let sheet = file.addWorksheet('Sheet');
        let worksheet = file.getWorksheet('Sheet');
        worksheet.columns = [
            { header: '№', key: 'id', width: 5 },
            { header: `IM'Я`, key: 'name', width: 25 },
            { header: 'ТЕЛЕФОН', key: 'phone', width: 20 },
            { header: 'EMAIL', key: 'email', width: 60 },
            { header: 'ДАТА РЕЄСТРАЦІЇ', key: 'created_at', width: 20 },
            { header: 'КОНТРАКТ', key: 'contract', width: 20 },
        ];

        // let {value} = await models.configs.findOne({where:{type: 'currency'}, raw: true});
        // let currencyValue = parseFloat(value);

        for (let j = 0; j < clients.length; j++) {
            let client = clients[j];
            client = client.toJSON()
            worksheet.addRow({
                id: client.id ? client.id : '----',
                name: client.first_name && client.last_name  ? (client.first_name + ' ' + client.last_name ): '----',
                phone: client.phone ? client.phone : '----',
                email: client.email ? client.email : '----',
                created_at: client.created_at ? client.created_at : '----',
                contract: client.signature_request_id ? 'є' : 'немає',
            });
        }
        // write to a new buffer
        file = await file.xlsx.writeBuffer();

        return file;
    },

}
