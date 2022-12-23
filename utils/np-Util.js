'use strict';

const axios = require('axios')
const config = require('../configs/config')
const { models } = require('../sequelize-orm');
const moment = require('moment');
module.exports = function NP(NP_PRIVATE_KEY) {

    this.url = "https://api.novaposhta.ua/v2.0/json/";

    this.getCityAddress = async function  getCityAddress(name) {

        let result =    await  axios({
            method: 'post',
            url: this.url ,
            data: JSON.stringify({
                dataType: 'json',
                modelName: 'Address',
                calledMethod: 'searchSettlements',
                methodProperties: {
                    CityName: name,
                    Limit: 555,
                    Language: "uk"
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })
        result =   result.data
        return result
    };

    this.getCity = async function  getCity(name) {

        let result =    await  axios({
            method: 'post',
            url: this.url ,
            data: JSON.stringify({
                dataType: 'json',
                modelName: 'Address',
                calledMethod: 'getCities',
                methodProperties: {
                    FindByString: name,
                    Limit: 20,
                    Language: "uk"
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })
        result =   result.data
        return result
    };

    this.getWarehousesAddress = async function getWarehousesAddress(CityRef) {

        let result = await axios({
            method: 'post',
            url: this.url,
            data: JSON.stringify({
                dataType: 'json',
                modelName: "Address",
                calledMethod: "getWarehouses",
                methodProperties: {
                    CityRef: CityRef,
                    Language: "uk"
                },
                apiKey: NP_PRIVATE_KEY
            }),
        });
        return result.data
    };
    this.geStreetAddress = async function geStreetAddress(StreetName,SettlementRef) {

        let result =  await  axios({
            method: 'post',
            url: this.url ,
            dataType: 'json',
            data: JSON.stringify({
                modelName: "Address",
                calledMethod: "searchSettlementStreets",
                methodProperties: {
                    StreetName: StreetName,
                    SettlementRef: SettlementRef,
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })

        result = result.data.data.map(function (i) {

            return i


        })
        return result
    };

    this.getCounterpartiesSender = async function getCounterpartiesSender() {

        let result =  await  axios({
            method: 'post',
            url: this.url ,
            dataType: 'json',
            data: JSON.stringify({
                modelName: "Counterparty",
                calledMethod: "getCounterparties",
                methodProperties: {
                    CounterpartyProperty: "Sender",
                    Page: 1
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })
        result =  result.data
        return result
    };

    this.getCounterpartyContactPersons = async function getCounterpartyContactPersons(Ref) {

        let result =  await  axios({
            method: 'post',
            url: this.url ,
            dataType: 'json',
            data: JSON.stringify({
                modelName: "Counterparty",
                calledMethod: "getCounterpartyContactPersons",
                methodProperties: {
                    Ref: Ref,
                    Page: 1
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })
        result =  result.data
        return result
    };

    this.saveInternetDocument = async function saveInternetDocument(params) {
        let   CitySender =  await models.config.findOne({where:{type: "city_sender"}, raw:true}) ;
        let   Sender =  await models.config.findOne({where:{type: "sender"}, raw:true}) ;
        let   ContactSender =  await models.config.findOne({where:{type: "contact_sender"}, raw:true}) ;
        let   SendersPhone =  await models.config.findOne({where:{type: "senders_phone"}, raw:true}) ;
        let   DateTime  = moment(new Date()).format('DD.MM.YYYY');
        let result =  await  axios({
            method: 'post',
            url: this.url ,
            dataType: 'json',
            data: JSON.stringify({
                modelName: "InternetDocument",
                calledMethod: "save",
                methodProperties:{
                    NewAddress:1,
                    PayerType:"Sender",
                    PaymentMethod:"Cash",
                    CargoType:"Parcel",
                    VolumeGeneral:params.VolumeGeneral,
                    Weight:params.Weight,
                    ServiceType:"WarehouseWarehouse",
                    SeatsAmount:params.SeatsAmount,
                    Description:params.description,
                    Cost:"1000",
                    CitySender: CitySender.value,
                    Sender:Sender.value,
                    ContactSender:ContactSender.value,
                    SendersPhone:SendersPhone.value,
                    RecipientCityName:params.RecipientCityName ,
                    RecipientArea:params.RecipientArea ? params.RecipientArea : "",
                    RecipientAreaRegions:params.RecipientAreaRegions ? params.RecipientAreaRegions : "",
                    RecipientAddressName:params.RecipientAddressName ? params.RecipientAddressName : "",
                    RecipientHouse:params.RecipientHouse ? params.RecipientHouse : "",
                    RecipientFlat:params.RecipientFlat ? params.RecipientFlat : "",
                    RecipientName:params.RecipientName,
                    RecipientType:"PrivatePerson",
                    RecipientsPhone:params.RecipientsPhone,
                    DateTime:  params.DateTime ? params.DateTime : DateTime
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })

        result =  result.data
        return result
    };

    this.chengeInternetDocument = async function chengeInternetDocument(params) {
        let   CitySender =  await models.config.findOne({where:{type: "city_sender"}, raw:true}) ;
        let   Sender =  await models.config.findOne({where:{type: "sender"}, raw:true}) ;
        let   ContactSender =  await models.config.findOne({where:{type: "contact_sender"}, raw:true}) ;
        let   SendersPhone =  await models.config.findOne({where:{type: "senders_phone"}, raw:true}) ;
        let   DateTime  = moment(new Date()).format('DD.MM.YYYY');
        let   infoInternetDocument  =  this.getInfoInternetDocument(params)
        let result =  await  axios({
            method: 'post',
            url: this.url ,
            dataType: 'json',
            data: JSON.stringify({
                modelName: "InternetDocument",
                calledMethod: "update",
                methodProperties:{
                    Ref:params.ref_tracking_number,
                    PayerType:"Sender",
                    PaymentMethod:"Cash",
                    CargoType:"Parcel",
                    VolumeGeneral:params.VolumeGeneral,
                    Weight:params.Weight,
                    ServiceType:"WarehouseWarehouse",
                    SeatsAmount:params.SeatsAmount,
                    Description:params.description,
                    Cost:"1000",
                    CitySender: CitySender.value,
                    Sender:Sender.value,
                    ContactSender:ContactSender.value,
                    SendersPhone:SendersPhone.value,
                    RecipientCityName:params.RecipientCityName ,
                    RecipientArea:params.RecipientArea ? params.RecipientArea : "",
                    RecipientAreaRegions:params.RecipientAreaRegions ? params.RecipientAreaRegions : "",
                    RecipientAddressName:params.RecipientAddressName ? params.RecipientAddressName : "",
                    RecipientHouse:params.RecipientHouse ? params.RecipientHouse : "",
                    RecipientFlat:params.RecipientFlat ? params.RecipientFlat : "",
                    RecipientName:params.RecipientName,
                    RecipientType:"PrivatePerson",
                    RecipientsPhone:params.RecipientsPhone,
                    DateTime:  params.DateTime ? params.DateTime : DateTime
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })

        result =  result.data
        return result
    };

    this.deleteInternetDocument = async function deleteInternetDocument(ref_tracking_number) {

        let result =  await  axios({
            method: 'post',
            url: this.url ,
            dataType: 'json',
            data: JSON.stringify({
                modelName: "InternetDocument",
                calledMethod: "delete",
                methodProperties:{
                    DocumentRefs: ref_tracking_number
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })

        result =  result.data
        return result
    };

    this.getInfoInternetDocument = async function getInfoInternetDocument(params) {

        let   DateTime  = moment(new Date()).format('DD.MM.YYYY');
        let result =  await  axios({
            method: 'post',
            url: this.url ,
            dataType: 'json',
            data: JSON.stringify({
                modelName: "InternetDocument",
                calledMethod: "generateReport",
                methodProperties:{
                    Ref:params.ref_tracking_number,
                    DocumentRefs:[params.ref_tracking_number],
                    Type: "json",
                    DateTime:  params.DateTime ? params.DateTime : DateTime
                },
                apiKey: NP_PRIVATE_KEY
            }),
        })

        result =  result.data && result.data[0] ?  result.data[0] : null
        return result
    };

    this.getPrintBarcodeFile =  async function getFile (req, res) {
        let link
        let params = req.body
        let TTN = params.TTN
        if (params.type == 'pdf')
        {
            link = `https://my.novaposhta.ua/orders/printMarking85x85/orders/${TTN}/type/pdf8/apiKey/${NP_PRIVATE_KEY}`
        }
        if (params.type == 'html')
        {
            link = `https://my.novaposhta.ua/orders/printMarking85x85/orders/${TTN}/type/html/apiKey/${NP_PRIVATE_KEY}`
        }
        //res.set('Content-Type','image/jpg')

        const axiosRequest = await axios({
            url: link,
            method: 'GET',
            responseType: 'stream'
        })

        axiosRequest.data.pipe(res);
    };



    return this;
};
