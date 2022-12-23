const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const config = require('../configs/config');
const linksService = require('../services/links.service');
const log = require('../utils/logger');
//Removing fields from arr or object
function removeFields(data, fields) {
    log.info(`Start removeFields util data:${JSON.stringify(data, fields)}`)
    if (!data) return data;
    const delFields = fields ? fields : [];
    let result = data;
    if (Array.isArray(result)) {
        result.forEach(function(obj, i) {
            result[i] = removeFields(obj, fields);
        })
    }
    if (typeof result === 'object') {
        Object.keys(result).forEach(function(key) {
            if (delFields.includes(key)) delete result[key];
            else result[key] = removeFields(result[key], fields);
        })
    }
    log.info(`End removeFields util data:${JSON.stringify(result)}`)
    return result;
}

function parseXmlToJson(xml){
    const json = {};
    for (const res of xml.matchAll(/(?:<(\w*)(?:\s[^>]*)*>)((?:(?!<\1).)*)(?:<\/\1>)|<(\w*)(?:\s*)*\/>/gm)) {
        const key = res[1] || res[3];
        const value = res[2] && parseXmlToJson(res[2]);
        json[key] = ((value && Object.keys(value).length) ? value : res[2]) || null;
    }
    return json;
}

module.exports = {

    removeFields: removeFields,

    getDataFromUserToReq: (user) => {
        log.info(`Start function getDataFromUserToReq. DATA: ${JSON.stringify(user)}`);
        user = user.toJSON();
        let userDataReq = {};

        if (user && user.role) {
            userDataReq.userType = user.role;
            userDataReq.userid = user.id;
            userDataReq.discount = user.discount;
            userDataReq.first_name = user.first_name;
            userDataReq.last_name = user.last_name;
            userDataReq.email = user.email;
            userDataReq.access_token = user.access_token;
        }
        log.info(`End function getDataFromUserToReq. DATA: ${JSON.stringify(userDataReq)}`);
        return userDataReq;
    },

    outputFormatGalleryContentForPosts: (post) => {
        log.info(`Start function outputFormatGalleryContentForPosts. DATA: ${JSON.stringify(post)}`);
        let data = post ? post.toJSON() : post;
        if (data && data.body && data.body.length) {
            data.body.map(i => {
                if (i.type === 1) {
                    i.content = [{ text: i.content }];
                    delete i['gallery_content'];
                }
                if (i.type === 2) {
                    i.gallery_content = i.gallery_content.map(i => {
                        return { image: i };
                    });
                    i.content = i.gallery_content;
                    delete i['gallery_content'];
                }
            });
        }
        log.info(`End function outputFormatGalleryContentForPosts. DATA: ${JSON.stringify(data)}`);
        return data;
    },

    inputFormatGalleryContentForPosts: (body, postId) => {
        log.info(`Start function inputFormatGalleryContentForPosts. DATA: ${JSON.stringify({body, postId})}`);
        let bodyData = [];
        if (body && body.length) {
            body.forEach(i => {
                const post_id = postId ? { post_id: postId } : {};
                if (i.type == 2) {
                    let imgIds = i.content.map(content_obj => { return { uploaded_images_id: content_obj.image.id } });
                    bodyData.push({ type: i.type, posts_body_images: imgIds, ...post_id });
                } else {
                    bodyData.push({ type: i.type, content: i.content[0] ? i.content[0].text : null, ...post_id });
                }
            })
        }
        log.info(`End function inputFormatGalleryContentForPosts. DATA: ${JSON.stringify(bodyData)}`);
        return bodyData;
    },

    convertPostBodyForDBFormat: (body, post_id) => {
        log.info(`Start convertPostBodyForDBFormat util data:${JSON.stringify(body, post_id)}`)
        const post_sections = [];

        if (body && body.length) {
            let sequenceNumber = 0;
            body.forEach((bodyItem, groupIndex) => {
                const groupType = bodyItem.type ? bodyItem.type : null;

                if (bodyItem.type && bodyItem.type === '1' && bodyItem.blocks && bodyItem.blocks.length) {
                    bodyItem.blocks.forEach(i => {
                        const data = {
                            block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null,
                            group_number: groupIndex + 1,
                            group_type: groupType,
                            sequence_number: sequenceNumber
                        };
                        if (post_id) data.post_id = post_id;
                        post_sections.push(data);
                        sequenceNumber++
                    });

                } else if (bodyItem.type && bodyItem.type !== '1') {

                    if (bodyItem.content && Object.keys(bodyItem.content).length) {
                        const content = bodyItem.content;
                        let data = {
                            is_content: true,
                            text: content.text ? content.text : null,
                            group_number: groupIndex + 1,
                            group_type: groupType,
                            sequence_number: sequenceNumber,
                            ids: content.ids ? content.ids : null,
                            title: content.title ? content.title : null,
                            video_link: content.video_link ? content.video_link : null,
                            image_left: content.image_left ? 1 : null,
                            block_button_text: content.block_button_text ? content.block_button_text : null,
                            block_button_link: content.block_button_link ? content.block_button_link : null,
                        };
                        if(content.images){
                            let arr = []
                            content.images.forEach((item) =>{
                                arr.push(item.block_image.id)
                            })
                            data.images =  JSON.stringify(arr)
                        }

                        if (post_id) data.post_id = post_id;
                        post_sections.push(data);
                        sequenceNumber++
                    }

                    if (bodyItem.blocks && bodyItem.blocks.length) {
                        bodyItem.blocks.forEach(i => {
                            let data = {
                                group_number: groupIndex + 1,
                                group_type: groupType,
                                sequence_number: sequenceNumber,
                                block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null
                            };
                            if (post_id) data.post_id = post_id;
                            post_sections.push(data);
                            sequenceNumber++
                        });
                    }
                }
            });
        }
        log.info(`End convertPostBodyForDBFormat util data:${JSON.stringify(post_sections)}`)
        return post_sections;
    },

    convertProductBodyForDBFormat: (body, product_id) => {
        log.info(`Start convertProductBodyForDBFormat util data:${JSON.stringify(body, product_id)}`)
        const product_sections = [];

        if (body && body.length) {
            let sequenceNumber = 0;
            body.forEach((bodyItem, groupIndex) => {
                const groupType = bodyItem.type ? bodyItem.type : null;

                if (bodyItem.type && bodyItem.type === '1' && bodyItem.blocks && bodyItem.blocks.length) {
                    bodyItem.blocks.forEach(i => {
                        const data = {
                            block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null,
                            group_number: groupIndex + 1,
                            group_type: groupType,
                            sequence_number: sequenceNumber
                        };
                        if (product_id) data.product_id = product_id;
                        product_sections.push(data);
                        sequenceNumber++
                    });

                } else if (bodyItem.type && bodyItem.type !== '1') {

                    if (bodyItem.content && Object.keys(bodyItem.content).length) {
                        const content = bodyItem.content;
                        let data = {
                            is_content: true,
                            text: content.text ? content.text : null,
                            group_number: groupIndex + 1,
                            group_type: groupType,
                            sequence_number: sequenceNumber,
                            ids: content.ids ? content.ids : null,
                            title: content.title ? content.title : null,
                            video_link: content.video_link ? content.video_link : null,
                            image_left: content.image_left ? 1 : null,
                            block_link: content.block_link ? content.block_link : null,
                            block_button_text: content.button_text ? content.button_text : null,
                            block_button_link: content.button_link ? content.button_link : null,
                        };

                        if(content.images && content.images.length){
                            let arr = [];
                            content.images.forEach((item) =>{
                                if(item.block_image && item.block_image.id) arr.push(item.block_image.id);
                            })
                            data.images =  JSON.stringify(arr);
                        }

                        if (product_id) data.product_id = product_id;
                        product_sections.push(data);
                        sequenceNumber++
                    }

                    if (bodyItem.blocks && bodyItem.blocks.length) {
                        bodyItem.blocks.forEach(i => {
                            let data = {
                                group_number: groupIndex + 1,
                                group_type: groupType,
                                sequence_number: sequenceNumber,
                                block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null
                            };
                            if (product_id) data.product_id = product_id;
                            product_sections.push(data);
                            sequenceNumber++
                        });
                    }
                }
            });
        }
        log.info(`End convertProductBodyForDBFormat util data:${JSON.stringify(product_sections)}`)
        return product_sections;
    },

    convertPageSectionsForDBFormat: (sections, page_id) => {
        log.info(`Start convertPageSectionsForDBFormat util data:${JSON.stringify(sections, page_id)}`)
        try {
            if (sections && sections.length && sections[0].body && sections[0].body.length) {
                sections[0].body.forEach(i => {
                    if (i.type === "14" && i.content && i.content.array_ids && i.content.array_ids.length) {
                        i.content.array_ids = i.content.array_ids.map(t => {
                            if (t && t.id) {
                                return t.id
                            }
                        });
                    }
                    if (i.type === "5" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id) {
                                return t.id
                            }
                        });
                    }
                    if (i.type === "6" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id) {
                                return t.id
                            }
                        });
                    }
                    if (i.type === "8" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id) {
                                return t.id
                            }
                        });
                    }
                    if (i.type === "7" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id) {
                                return t.id
                            }
                        });
                    }
                    if (i.type === "16" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id && typeof  t == 'object') {
                                return t.id
                            }else if(typeof t == "number"){
                                return t
                            }
                        });
                    }
                    if (i.type === "18" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id && typeof  t == 'object') {
                                return t.id
                            }else if(typeof t == "number"){
                                return t
                            }
                        });
                    }
                    if (i.type === "22" && i.content && i.content.ids && i.content.ids.length || i.type === "23" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id && typeof  t == 'object') {
                                return t.id
                            }else if(typeof t == "number"){
                                return t
                            }
                        });
                    }
                    if (i.type === "20" && i.content && i.content.ids && i.content.ids.length) {
                        i.content.ids = i.content.ids.map(t => {
                            if (t && t.id && typeof  t == 'object') {
                                return t.id
                            }else if(typeof t == "number"){
                                return t
                            }
                        });
                    }

                })
            }

            const pages_sections = [];

            if (sections && sections.length) {
                let sequenceNumber = 0;
                sections.forEach((sectionItem, sectionIndex) => {

                    let sectionTitle = sectionItem.title ? sectionItem.title : null;
                    let section_icon_id = sectionItem.title_icon && sectionItem.title_icon.id ? sectionItem.title_icon.id : null;
                    if (sectionItem.body && sectionItem.body.length) {

                        sectionItem.body.forEach((bodyItem, groupIndex) => {
                            const groupType = bodyItem.type ? bodyItem.type : null;
                            // let groupTitle = bodyItem.title ? bodyItem.title : null;

                            if (bodyItem.type && bodyItem.type === '1' && bodyItem.blocks && bodyItem.blocks.length) {
                                bodyItem.blocks.forEach(i => {
                                    const data = {
                                        block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null,
                                        section_number: sectionIndex + 1,
                                        section_title: sectionTitle,
                                        section_icon_id: section_icon_id,
                                        group_number: groupIndex + 1,
                                        group_type: groupType,
                                        sequence_number: sequenceNumber
                                    };
                                    if (page_id) data.page_id = page_id;
                                    pages_sections.push(data);
                                    sequenceNumber++
                                });

                            } else if (bodyItem.type && bodyItem.type !== '1') {

                                if (bodyItem.content && Object.keys(bodyItem.content).length) {
                                    const content = bodyItem.content;
                                    let data = {
                                        is_content: true,
                                        title: content.title ? content.title : null,
                                        text: content.text ? content.text : null,
                                        text_2: content.text_2 ? content.text_2 : null,
                                        image_id: content.image && content.image.id ? content.image.id : null,
                                        banner_image_id : content.banner_image && content.banner_image.id ? content.banner_image.id :null,
                                        link: content.link ? content.link : null,
                                        link_title: content.link_title ? content.link_title : null,
                                        section_number: sectionIndex + 1,
                                        section_title: sectionTitle,
                                        section_icon_id: section_icon_id,
                                        group_number: groupIndex + 1,
                                        group_type: groupType,
                                        sequence_number: sequenceNumber,
                                        email: content.email ? content.email : null,
                                        phone: content.phone ? content.phone : null,
                                        address: content.address ? content.address : null,
                                        lat: content.lat ? content.lat : null,
                                        lng: content.lng ? content.lng : null,
                                        zoom: content.zoom ? content.zoom : null,
                                        array_ids: content.array_ids ? JSON.stringify(content.array_ids) : null,
                                        ids: content.ids ? JSON.stringify(content.ids) : null,
                                        name: content.name ? content.name : null,
                                        image_mobile_id: content.image_mobile && content.image_mobile.id ? content.image_mobile.id : null,
                                        block_link: content.block_link ? content.block_link : null,
                                        block_button_text: content.button_text ? content.button_text : null,
                                        block_button_link: content.button_link ? content.button_link : null,
                                        marker_lat: content.marker_lat ? content.marker_lat : null,
                                        marker_lng: content.marker_lng ? content.marker_lng : null,
                                        image_left: content.image_left ? content.image_left : null,
                                        video_link: content.video_link ? content.video_link : null,
                                        date: content.date ? content.date : null,
                                        form_id: content.form_id ? content.form_id : null
                                    };
                                    if(content.images){
                                        let arr = []
                                        content.images.forEach((item) =>{
                                            arr.push(item.block_image.id)
                                        })
                                        data.images =  JSON.stringify(arr)
                                    }
                                    if (page_id) data.page_id = page_id;
                                    pages_sections.push(data);
                                    sequenceNumber++;
                                }

                                if (bodyItem.blocks && bodyItem.blocks.length) {
                                    bodyItem.blocks.forEach(i => {
                                        let data = {
                                            section_number: sectionIndex + 1,
                                            section_title: sectionTitle,
                                            section_icon_id: section_icon_id,
                                            group_number: groupIndex + 1,
                                            group_type: groupType,
                                            sequence_number: sequenceNumber,
                                            block_title: i.block_title ? i.block_title : null,
                                            block_text: i.block_text ? i.block_text : null,
                                            block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null,
                                            block_video_id: i.block_video && i.block_video.id ? i.block_video.id : null,
                                            block_image_hover_id: i.block_image_hover && i.block_image_hover.id ? i.block_image_hover.id : null,
                                            image_mobile_id: i.block_image_mobile && i.block_image_mobile.id ? i.block_image_mobile.id : null,
                                            block_link: i.block_link ? i.block_link : null,
                                            block_lat: i.block_lat ? i.block_lat : null,
                                            block_lng: i.block_lng ? i.block_lng : null,

                                            block_video_link: i.block_video_link ? i.block_video_link : null,
                                            block_button_text: i.block_button_text ? i.block_button_text : null,
                                            block_button_link: i.block_button_link ? i.block_button_link : null,

                                            block_map_background_image_id: i.block_map_background_image && i.block_map_background_image.id ? i.block_map_background_image.id : null,
                                            block_map_image_id: i.block_map_image && i.block_map_image.id ? i.block_map_image.id : null,
                                            block_email: i.block_email ? i.block_email : null,
                                            block_phone: i.block_phone ? i.block_phone : null,
                                            block_address: i.block_address ? i.block_address : null,
                                            block_item_id: i.block_item_id ? i.block_item_id : null,
                                            block_image_left: i.block_image_left ? i.block_image_left : null,
                                            social_link_1 :i.social_link_1 ? i.social_link_1 :null,
                                            social_link_2 :i.social_link_2 ? i.social_link_2 :null,
                                            social_link_3 :i.social_link_3 ? i.social_link_3 :null,
                                            social_icon_1 :i.social_icon_1 && i.social_icon_1.id ? i.social_icon_1.id :null,
                                            social_icon_2 :i.social_icon_2 && i.social_icon_2.id ? i.social_icon_2.id :null,
                                            social_icon_3 :i.social_icon_3 && i.social_icon_3.id ? i.social_icon_3.id :null,

                                            //block_array_ids: i.block_array_ids ? JSON.stringify(i.block_array_ids) : null,
                                            //ids: i.ids ? JSON.stringify(i.ids) : null,
                                            date: i.date ? i.date : null
                                            //group_title: groupTitle,
                                        };
                                        if(i.block_images){
                                            let arr = []
                                            i.block_images.forEach((item) =>{
                                                arr.push(item.block_image.id)
                                            })
                                            data.block_images =  JSON.stringify(arr)
                                        }
                                        if(i.ids){
                                            let arr = []
                                            i.ids = i.ids.forEach((item) =>{
                                                if( item && item.id){
                                                    arr.push(item.id)

                                                }
                                            })
                                            data.ids =  JSON.stringify(arr)
                                        }
                                        if(i.block_array_ids){
                                            let arr = []
                                            i.block_array_ids = i.block_array_ids.forEach((item) =>{
                                                arr.push(item.id)
                                            })
                                            data.block_array_ids =  JSON.stringify(arr)
                                        }
                                        if (page_id) data.page_id = page_id;
                                        pages_sections.push(data);
                                        sequenceNumber++;
                                    });
                                }
                            }
                        });
                    }
                });
            }
            log.info(`End convertPageSectionsForDBFormat util data:${JSON.stringify(pages_sections)}`)
            return pages_sections;
        }catch(error){
            log.error(`${error}`);
            throw error;
        }


    },
    convertServiceSectionsForDBFormat: (sections, page_id) => {
        log.info(`Start convertPageSectionsForDBFormat util data:${JSON.stringify(sections, page_id)}`)
        if (sections && sections.length && sections[0].body && sections[0].body.length) {
            sections[0].body.forEach(i => {
                if (i.type === "14" && i.content && i.content.array_ids && i.content.array_ids.length) {
                    i.content.array_ids = i.content.array_ids.map(t => {
                        if (t && t.id) {
                            return t.id
                        }
                    });
                }
                if (i.type === "5" && i.content && i.content.ids && i.content.ids.length) {
                    i.content.ids = i.content.ids.map(t => {
                        if (t && t.id) {
                            return t.id
                        }
                    });
                }
                if (i.type === "6" && i.content && i.content.ids && i.content.ids.length) {
                    i.content.ids = i.content.ids.map(t => {
                        if (t && t.id) {
                            return t.id
                        }
                    });
                }
                if (i.type === "8" && i.content && i.content.ids && i.content.ids.length) {
                    i.content.ids = i.content.ids.map(t => {
                        if (t && t.id) {
                            return t.id
                        }
                    });
                }
                if (i.type === "7" && i.content && i.content.ids && i.content.ids.length) {
                    i.content.ids = i.content.ids.map(t => {
                        if (t && t.id) {
                            return t.id
                        }
                    });
                }
                if (i.type === "16" && i.content && i.content.ids && i.content.ids.length || i.type === "18" && i.content && i.content.ids && i.content.ids.length) {
                    i.content.ids = i.content.ids.map(t => {
                        if (t && t.id) {
                            return t.id
                        }
                    });
                }
                if (i.type === "20" && i.content && i.content.ids && i.content.ids.length) {
                    i.content.ids = i.content.ids.map(t => {
                        if (t && t.id) {
                            return t.id
                        }
                    });
                }

            })
        }

        const pages_sections = [];

        if (sections && sections.length) {
            let sequenceNumber = 0;
            sections.forEach((sectionItem, sectionIndex) => {

                let sectionTitle = sectionItem.title ? sectionItem.title : null;
                let section_icon_id = sectionItem.title_icon && sectionItem.title_icon.id ? sectionItem.title_icon.id : null;
                if (sectionItem.body && sectionItem.body.length) {

                    sectionItem.body.forEach((bodyItem, groupIndex) => {
                        const groupType = bodyItem.type ? bodyItem.type : null;
                        // let groupTitle = bodyItem.title ? bodyItem.title : null;

                        if (bodyItem.type && bodyItem.type === '1' && bodyItem.blocks && bodyItem.blocks.length) {
                            bodyItem.blocks.forEach(i => {
                                const data = {
                                    block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null,
                                    section_number: sectionIndex + 1,
                                    section_title: sectionTitle,
                                    section_icon_id: section_icon_id,
                                    group_number: groupIndex + 1,
                                    group_type: groupType,
                                    sequence_number: sequenceNumber
                                };
                                if (page_id) data.page_id = page_id;
                                pages_sections.push(data);
                                sequenceNumber++
                            });

                        } else if (bodyItem.type && bodyItem.type !== '1') {

                            if (bodyItem.content && Object.keys(bodyItem.content).length) {

                                const content = bodyItem.content;
                                let data = {
                                    is_content: true,
                                    title: content.title ? content.title : null,
                                    text: content.text ? content.text : null,
                                    text_2: content.text_2 ? content.text_2 : null,
                                    image_id: content.image && content.image.id ? content.image.id : null,
                                    link: content.link ? content.link : null,
                                    link_title: content.link_title ? content.link_title : null,
                                    section_number: sectionIndex + 1,
                                    section_title: sectionTitle,
                                    section_icon_id: section_icon_id,
                                    group_number: groupIndex + 1,
                                    group_type: groupType,
                                    sequence_number: sequenceNumber,
                                    email: content.email ? content.email : null,
                                    phone: content.phone ? content.phone : null,
                                    address: content.address ? content.address : null,
                                    lat: content.lat ? content.lat : null,
                                    lng: content.lng ? content.lng : null,
                                    zoom: content.zoom ? content.zoom : null,
                                    array_ids: content.array_ids ? JSON.stringify(content.array_ids) : null,
                                    ids: content.ids ? JSON.stringify(content.ids) : null,
                                    name: content.name ? content.name : null,
                                    image_mobile_id: content.image_mobile && content.image_mobile.id ? content.image_mobile.id : null,
                                    block_link: content.block_link ? content.block_link : null,
                                    block_button_text: content.button_text ? content.button_text : null,
                                    block_button_link: content.button_link ? content.button_link : null,
                                    marker_lat: content.marker_lat ? content.marker_lat : null,
                                    marker_lng: content.marker_lng ? content.marker_lng : null,
                                    image_left: content.image_left ? content.image_left : null,
                                    video_link: content.video_link ? content.video_link : null,
                                    date: content.date ? content.date : null,
                                    form_id: content.form_id ? content.form_id : null
                                };
                                if(content.images){
                                    let arr = []
                                    content.images.forEach((item) =>{
                                        arr.push(item.block_image.id)
                                    })
                                    data.images =  JSON.stringify(arr)
                                }
                                if (page_id) data.page_id = page_id;
                                pages_sections.push(data);
                                sequenceNumber++;
                            }

                            if (bodyItem.blocks && bodyItem.blocks.length) {
                                bodyItem.blocks.forEach(i => {
                                    let data = {
                                        section_number: sectionIndex + 1,
                                        section_title: sectionTitle,
                                        section_icon_id: section_icon_id,
                                        group_number: groupIndex + 1,
                                        group_type: groupType,
                                        sequence_number: sequenceNumber,
                                        block_title: i.block_title ? i.block_title : null,
                                        block_text: i.block_text ? i.block_text : null,
                                        block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null,
                                        block_video_id: i.block_video && i.block_video.id ? i.block_video.id : null,
                                        block_image_hover_id: i.block_image_hover && i.block_image_hover.id ? i.block_image_hover.id : null,
                                        image_mobile_id: i.block_image_mobile && i.block_image_mobile.id ? i.block_image_mobile.id : null,
                                        block_link: i.block_link ? i.block_link : null,
                                        block_lat: i.block_lat ? i.block_lat : null,
                                        block_lng: i.block_lng ? i.block_lng : null,

                                        block_video_link: i.block_video_link ? i.block_video_link : null,
                                        block_button_text: i.block_button_text ? i.block_button_text : null,
                                        block_button_link: i.block_button_link ? i.block_button_link : null,

                                        block_map_background_image_id: i.block_map_background_image && i.block_map_background_image.id ? i.block_map_background_image.id : null,
                                        block_map_image_id: i.block_map_image && i.block_map_image.id ? i.block_map_image.id : null,
                                        block_email: i.block_email ? i.block_email : null,
                                        block_phone: i.block_phone ? i.block_phone : null,
                                        block_address: i.block_address ? i.block_address : null,
                                        block_item_id: i.block_item_id ? i.block_item_id : null,
                                        block_image_left: i.block_image_left ? i.block_image_left : null,
                                        social_link_1 :i.social_link_1 ? i.social_link_1 :null,
                                        social_link_2 :i.social_link_2 ? i.social_link_2 :null,
                                        social_link_3 :i.social_link_3 ? i.social_link_3 :null,
                                        social_icon_1 :i.social_icon_1 && i.social_icon_1.id ? i.social_icon_1.id :null,
                                        social_icon_2 :i.social_icon_2 && i.social_icon_2.id ? i.social_icon_2.id :null,
                                        social_icon_3 :i.social_icon_3 && i.social_icon_3.id ? i.social_icon_3.id :null,
                                        //block_array_ids: i.block_array_ids ? JSON.stringify(i.block_array_ids) : null,
                                        //ids: i.ids ? JSON.stringify(i.ids) : null,
                                        date: i.date ? i.date : null
                                        //group_title: groupTitle,
                                    };
                                    if(i.block_images){
                                        let arr = []
                                        i.block_images.forEach((item) =>{
                                            arr.push(item.block_image.id)
                                        })
                                        data.block_images =  JSON.stringify(arr)
                                    }

                                    if(i.ids){
                                        let arr = []
                                        i.ids = i.ids.forEach((item) =>{
                                            arr.push(item.id)
                                        })
                                        data.ids =  JSON.stringify(arr)
                                    }
                                    if(i.block_array_ids){
                                        let arr = []
                                        i.block_array_ids = i.block_array_ids.forEach((item) =>{
                                            arr.push(item.id)
                                        })
                                        data.block_array_ids =  JSON.stringify(arr)
                                    }
                                    if (page_id) data.page_id = page_id;
                                    pages_sections.push(data);
                                    sequenceNumber++;
                                });
                            }
                        }
                    });
                }
            });
        }
        log.info(`End convertPageSectionsForDBFormat util data:${JSON.stringify(pages_sections)}`)
        return pages_sections;
    },
    convertPageSectionsForFrontendFormat: async(pages_contents, lang) => {
        log.info(`Start function convertPageSectionsForFrontendFormat. DATA: ${JSON.stringify(pages_contents)}`);
        let result = [];

        if (pages_contents && pages_contents.length) {

            let sections = [];
            let sectionBody = [];
            let sectionNumber = null;
            let sectionTitle;
            let groupNumber = null;
            let contentType;
            let tempContent = [];
            let staticContent = {};
            let sectionIcon = {};
            // let groupTitle;

            //pages_contents.forEach((contentItem, idx, array) => {
            for(let i = 0; i<pages_contents.length; i++) {
                if (pages_contents[i].section_number && pages_contents[i].group_number) {
                    if (sectionNumber === null) {
                        sectionNumber = pages_contents[i].section_number;
                        sectionTitle = pages_contents[i].section_title;
                        sectionIcon = pages_contents[i].section_icon;
                    }
                    if (groupNumber === null) {
                        groupNumber = pages_contents[i].group_number;
                        contentType = pages_contents[i].group_type;
                        // groupTitle = contentItem.group_title;
                    }

                    if (sectionNumber === pages_contents[i].section_number) {

                        if (groupNumber !== pages_contents[i].group_number) {
                            // save and go to the next group
                            sectionBody.push({
                                type: contentType,
                                // title: groupTitle,
                                content: staticContent,
                                blocks: tempContent,
                            });
                            tempContent = [];
                            staticContent = {};
                            groupNumber = pages_contents[i].group_number;
                            contentType = pages_contents[i].group_type;
                            // groupTitle = contentItem.group_title;
                        }

                    } else {
                        // save and go to the next section
                        sectionBody.push({
                            type: contentType,
                            // title: groupTitle,
                            content: staticContent,
                            blocks: tempContent,
                        });
                        tempContent = [];
                        staticContent = {};
                        groupNumber = pages_contents[i].group_number;
                        contentType = pages_contents[i].group_type;

                        sections.push({
                            title: sectionTitle,
                            title_icon: sectionIcon,
                            body: sectionBody,
                        });
                        sectionBody = [];
                        sectionNumber = pages_contents[i].section_number;
                        sectionTitle = pages_contents[i].section_title;
                        sectionIcon = pages_contents[i].section_icon;
                    }

                    let data = {};

                    if (pages_contents[i].is_content) {

                        if (pages_contents[i].title) data.title = pages_contents[i].title;
                        if (pages_contents[i].text) data.text = pages_contents[i].text;
                        if (pages_contents[i].text_2) data.text_2 = pages_contents[i].text_2;
                        if (pages_contents[i].image) data.image = pages_contents[i].image;
                        if (pages_contents[i].link) data.link = pages_contents[i].link;
                        if (pages_contents[i].link_title) data.link_title = pages_contents[i].link_title;
                        if (pages_contents[i].email) data.email = pages_contents[i].email;
                        if (pages_contents[i].phone) data.phone = pages_contents[i].phone;
                        if (pages_contents[i].address) data.address = pages_contents[i].address;
                        if (pages_contents[i].lat) data.lat = pages_contents[i].lat;
                        if (pages_contents[i].lng) data.lng = pages_contents[i].lng;
                        if (pages_contents[i].zoom) data.zoom = pages_contents[i].zoom;
                        if (pages_contents[i].array_ids) data.array_ids = JSON.parse(pages_contents[i].array_ids);
                        if (pages_contents[i].ids) data.ids = JSON.parse(pages_contents[i].ids);
                        if (pages_contents[i].name) data.name = pages_contents[i].name;
                        if (pages_contents[i].block_button_text) data.button_text = pages_contents[i].block_button_text;
                        if (pages_contents[i].block_button_link) data.button_link = pages_contents[i].block_button_link;
                        if (pages_contents[i].image_left) data.image_left = pages_contents[i].image_left;
                        if (pages_contents[i].block_image_mobile) data.image_mobile = pages_contents[i].image_mobile;
                        if (pages_contents[i].marker_lng) data.marker_lng = pages_contents[i].marker_lng;
                        if (pages_contents[i].marker_lat) data.marker_lat = pages_contents[i].marker_lat;
                        if (pages_contents[i].date) data.date = pages_contents[i].date
                        if (pages_contents[i].video_link) data.video_link = pages_contents[i].video_link
                        if (pages_contents[i].form_id) data.form = pages_contents[i].form_id
                        if (pages_contents[i].images && pages_contents[i].images.length){
                            let images = JSON.parse(pages_contents[i].images)
                            let images_result = await models.uploaded_files.findAll({
                                where: {
                                    id: {
                                        [Op.in] : images
                                    }
                                }
                            })
                            if(images_result && images_result.length){
                                images_result = images_result.map((item) => item.toJSON())

                                let arr = []
                                images_result.forEach((item)=> arr.push({"block_image": item}))
                                data.images = arr
                            }

                        }
                        if (pages_contents[i].form_id){
                            let get_form = await models.forms.findOne({
                                where: {
                                    id: pages_contents[i].form_id
                                },
                                include:[{model: models.uploaded_files,as: "popup_icon"}]
                                // { [Op.or]: [{ id: pages_contents[i].form_id, lang: lang }, { origin_id: pages_contents[i].form_id, lang: lang }] }
                            })
                            get_form = get_form.toJSON()
                            data.form = get_form
                            data.form_id = pages_contents[i].form_id
                        }


                        if (pages_contents[i].image_id){
                            let image = await models.uploaded_files.findOne({
                                where: {
                                    id: pages_contents[i].image_id
                                }
                            })
                            image = image.toJSON()
                            data.image = image
                        }
                        if (pages_contents[i].banner_image_id){
                            let banner_image = await models.uploaded_files.findOne({
                                where: {
                                    id: pages_contents[i].banner_image_id
                                }
                            })
                            banner_image = banner_image.toJSON()
                            data.banner_image = banner_image
                        }
                        // if (pages_contents[i].image_mobile_id){
                        //     let image = await models.uploaded_files.findAll({
                        //         where: {
                        //             id: pages_contents[i].image_mobile_id
                        //         }
                        //     })
                        //     image = image.toJSON()
                        //     data.image_mobile = image
                        // }


                        staticContent = data;
                    } else {
                        if (pages_contents[i].block_video_link) data.block_video_link = pages_contents[i].block_video_link;
                        if (pages_contents[i].block_title) data.block_title = pages_contents[i].block_title;
                        if (pages_contents[i].block_text) data.block_text = pages_contents[i].block_text;
                        if (pages_contents[i].block_image) data.block_image = pages_contents[i].block_image;
                        if (pages_contents[i].block_image_hover) data.block_image_hover = pages_contents[i].block_image_hover;
                        if (pages_contents[i].block_video) data.block_video = pages_contents[i].block_video;
                        if (pages_contents[i].block_image_mobile) data.block_image_mobile = pages_contents[i].image_mobile;
                        if (pages_contents[i].block_link) data.block_link = pages_contents[i].block_link;
                        if (pages_contents[i].block_lat) data.block_lat = pages_contents[i].block_lat;
                        if (pages_contents[i].block_lng) data.block_lng = pages_contents[i].block_lng;
                        if (pages_contents[i].block_email) data.block_email = pages_contents[i].block_email;
                        if (pages_contents[i].block_phone) data.block_phone = pages_contents[i].block_phone;
                        if (pages_contents[i].block_address) data.block_address = pages_contents[i].block_address;
                        if (pages_contents[i].block_map_background_image) data.block_map_background_image = pages_contents[i].block_map_background_image;
                        if (pages_contents[i].block_map_image) data.block_map_image = pages_contents[i].block_map_image;
                        if (pages_contents[i].block_item_id) data.block_item_id = pages_contents[i].block_item_id;
                        if (pages_contents[i].block_array_ids) data.block_array_ids = JSON.parse(pages_contents[i].block_array_ids);
                        if (pages_contents[i].ids) data.ids = JSON.parse(pages_contents[i].ids);
                        if (pages_contents[i].block_button_link) data.block_button_link = pages_contents[i].block_button_link;
                        if (pages_contents[i].block_button_text) data.block_button_text = pages_contents[i].block_button_text;
                        if (pages_contents[i].social_link_1) data.social_link_1 = pages_contents[i].social_link_1;
                        if (pages_contents[i].social_link_2) data.social_link_2 = pages_contents[i].social_link_2;
                        if (pages_contents[i].social_link_3) data.social_link_3 = pages_contents[i].social_link_3;
                        if (pages_contents[i].date) data.date = pages_contents[i].date
                        if(pages_contents[i].block_image_left) data.block_image_left = pages_contents[i].block_image_left
                        tempContent.push(data);
                        if(pages_contents[i].social_icon_1){
                            data.social_icon_1 = await models.uploaded_files.findOne({where:{
                                id:pages_contents[i].social_icon_1
                                },raw:true})
                        }
                        if(pages_contents[i].social_icon_2){
                            data.social_icon_2 = await models.uploaded_files.findOne({where:{
                                    id:pages_contents[i].social_icon_2
                                },raw:true})
                        }
                        if(pages_contents[i].social_icon_3){
                            data.social_icon_3 = await models.uploaded_files.findOne({where:{
                                    id:pages_contents[i].social_icon_3
                                },raw:true})
                        }
                        if(pages_contents[i].block_images){
                            let images = JSON.parse(pages_contents[i].block_images)
                            let images_result = await models.uploaded_files.findAll({
                                where: {
                                    id: {
                                        [Op.in] : images
                                    }
                                }
                            })
                            if(images_result && images_result.length){
                                images_result = images_result.map((item) => item.toJSON())

                                let arr = []
                                images_result.forEach((item)=> arr.push({"block_image": item}))
                                data.block_images = arr
                            }
                        }
                    }
                }
                // save last items before end
                if (i === pages_contents.length - 1) {
                    if (contentType || sectionTitle || tempContent.length || Object.keys(staticContent).length || sectionBody.length) {
                        sectionBody.push({
                            type: contentType,
                            content: staticContent,
                            blocks: tempContent,
                            // title: groupTitle,
                        });
                        sections.push({
                            title: sectionTitle,
                            title_icon: sectionIcon,
                            body: sectionBody

                        });
                    }
                }
            }
            //});

            if (sections && sections.length && sections[0].body && sections[0].body.length) {
                for (let i = 0; i < sections[0].body.length; i++) {
                    let block = sections[0].body[i];
                    if (block.type === "14" && block.content.array_ids && block.content.array_ids.length) {
                        let testimonials = await models.testimonials.findAll({
                            where: {
                                id: {
                                    [Op.in]: block.content.array_ids
                                },
                                status: config.GLOBAL_STATUSES.ACTIVE
                            },
                            include: [{ model: models.uploaded_files, as: "image" }]
                        });
                        testimonials = testimonials.map(i => i.toJSON());
                        block.content.array_ids = block.content.array_ids.map(x => { return testimonials.find(y => { return y.id === x }) });
                        block.content.array_ids = block.content.array_ids.filter(i => i != null);
                    }
                    if (block.type === "16" && block.content.ids && block.content.ids.length) {
                        if(typeof block.content.ids[0] == 'object')block.content.ids = block.content.ids.map(i=>i.id)
                        let testimonials = await models.reviews.findAll({
                            where: {
                                id: {
                                    [Op.in]: block.content.ids
                                },
                                status: config.GLOBAL_STATUSES.ACTIVE
                            },
                        });
                        testimonials = testimonials.map(i => i.toJSON());
                        block.content.ids = block.content.ids.map(x => { return testimonials.find(y => { return y.id === x }) });
                        block.content.ids = block.content.ids.filter(i => i != null);
                    }
                    if (block.type === "18" && block.content.ids && block.content.ids.length) {
                        if(typeof block.content.ids[0] == 'object')block.content.ids = block.content.ids.map(i=>i.id)
                        let testimonials = await models.faq.findAll({
                            where: {
                                id: {
                                    [Op.in]: block.content.ids
                                },
                                status: config.GLOBAL_STATUSES.ACTIVE
                            },
                        });
                        testimonials = testimonials.map(i => i.toJSON());
                        block.content.ids = block.content.ids.map(x => { return testimonials.find(y => { return y.id === x }) });
                        block.content.ids = block.content.ids.filter(i => i != null);
                    }
                    if (block.type === "22" && block.content.ids && block.content.ids.length||block.type === "23" && block.content.ids && block.content.ids.length) {
                        if(typeof block.content.ids[0] == 'object')block.content.ids = block.content.ids.map(i=>i.id)
                        let testimonials = await models.service.findAll({
                            where: {
                                id: {
                                    [Op.in]: block.content.ids
                                },
                                status: config.GLOBAL_STATUSES.ACTIVE
                            },
                        });
                        testimonials = testimonials.map(i => i.toJSON());
                        block.content.ids = block.content.ids.map(x => { return testimonials.find(y => { return y.id === x }) });
                        block.content.ids = block.content.ids.filter(i => i != null);
                    }
                    if (block.type === "20" && block.content.ids && block.content.ids.length) {
                        if(typeof block.content.ids[0] == 'object')block.content.ids = block.content.ids.map(i=>i.id)
                        let testimonials = await models.service_category.findAll({
                            where: {
                                id: {
                                    [Op.in]: block.content.ids
                                },
                                status: config.GLOBAL_STATUSES.ACTIVE
                            },
                        });
                        testimonials = testimonials.map(i => i.toJSON());
                        block.content.ids = block.content.ids.map(x => { return testimonials.find(y => { return y.id === x }) });
                        block.content.ids = block.content.ids.filter(i => i != null);
                    }
                    if (block.type === "5" && block.content.ids && block.content.ids.length) {
                        let product_category = await models.product_category.findAll({
                            where: {
                                id: {
                                    [Op.in]: block.content.ids
                                },
                                status: config.GLOBAL_STATUSES.ACTIVE
                            },
                            include: [{ model: models.uploaded_files, as: "image" }]
                        });
                        if (product_category && product_category.length) {
                            let catsSlug = [];
                            product_category = product_category.map(el => {
                                el = el.toJSON();
                                catsSlug.push(`/shop/getCategory/${el.id}`);
                                return el;
                            });
                            catsSlug = await models.links.findAll({
                                where: { original_link: catsSlug },
                                raw: true
                            })

                            for (let item of product_category) {
                                if(item.id){
                                    let catSlug = catsSlug.find(el => el.original_link == `/shop/getCategory/${item.id}`);
                                    if(catSlug && catSlug.slug) item.slug = lang === config.LANGUAGES[0] ? `${catSlug.slug}` : `${lang}/${catSlug.slug}`;
                                }
                            }

                            let  catArr = []
                            for (const el of block.content.ids) {
                                let item = product_category.find(e => e.id == el || e.origin_id == el);
                                if (item) catArr.push(item)
                            }
                            block.content.ids = catArr
                        } else block.content.ids = []

                    }
                }
            }

            result = sections;
        }
        log.info(`End function convertPageSectionsForFrontendFormat. DATA: ${JSON.stringify(result)}`);
        return result;
    },

    convertPromotionBodyForDBFormat: (body, promotion_id) => {
        log.info(`Start convertPromotionBodyForDBFormat util data:${JSON.stringify(body, promotion_id)}`)
        const promotion_sections = [];

        if (body && body.length) {
            let sequenceNumber = 0;
            body.forEach((bodyItem, groupIndex) => {
                const groupType = bodyItem.type ? bodyItem.type : null;

                if (bodyItem.type && bodyItem.type === '1' && bodyItem.blocks && bodyItem.blocks.length) {
                    bodyItem.blocks.forEach(i => {
                        const data = {
                            block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null,
                            group_number: groupIndex + 1,
                            group_type: groupType,
                            sequence_number: sequenceNumber
                        };
                        if (promotion_id) data.promotion_id = promotion_id;
                        promotion_sections.push(data);
                        sequenceNumber++
                    });

                } else if (bodyItem.type && bodyItem.type !== '1') {

                    if (bodyItem.content && Object.keys(bodyItem.content).length) {
                        const content = bodyItem.content;
                        let ids = content.ids && content.ids.length ? content.ids.map(el => el.id) : null;
                        let data = {
                            is_content: true,
                            text: content.text ? content.text : null,
                            group_number: groupIndex + 1,
                            group_type: groupType,
                            sequence_number: sequenceNumber,
                            ids: ids && ids.length ? JSON.stringify(ids) : null,
                            title: content.title ? content.title : null,
                            video_link: content.video_link ? content.video_link : null,
                            image_left: content.image_left ? 1 : null,
                            block_button_text: content.block_button_text ? content.block_button_text : null,
                            block_button_link: content.block_button_link ? content.block_button_link : null,
                        };
                        if(content.images){
                            let arr = []
                            content.images.forEach((item) =>{
                                arr.push(item.block_image.id)
                            })
                            data.images =  JSON.stringify(arr)
                        };
                        if (promotion_id) data.promotion_id = promotion_id;
                        promotion_sections.push(data);
                        sequenceNumber++
                    }

                    if (bodyItem.blocks && bodyItem.blocks.length) {
                        bodyItem.blocks.forEach(i => {
                            let data = {
                                group_number: groupIndex + 1,
                                group_type: groupType,
                                sequence_number: sequenceNumber,
                                block_image_id: i.block_image && i.block_image.id ? i.block_image.id : null
                            };
                            if (promotion_id) data.promotion_id = promotion_id;
                            promotion_sections.push(data);
                            sequenceNumber++
                        });
                    }
                }
            });
        }
        log.info(`End function convertPromotionBodyForDBFormat. DATA: ${JSON.stringify(promotion_sections)}`);
        return promotion_sections;
    },


    convertPostBodyForFrontendFormat: async(posts_contents) => {
        log.info(`Start function convertPostBodyForFrontendFormat. DATA: ${JSON.stringify(posts_contents)}`);
        let result = [];

        if (posts_contents && posts_contents.length) {

            let sectionBody = [];
            let groupNumber = null;
            let contentType;
            let tempContent = [];
            let staticContent = {};

                for(let i = 0; i<posts_contents.length;i++ ){
                //posts_contents.forEach(async(contentItem, idx, array) => {
                    if (posts_contents[i].group_number) {
                        if (groupNumber === null) {
                            groupNumber = posts_contents[i].group_number;
                            contentType = posts_contents[i].group_type;
                        }

                        if (groupNumber !== posts_contents[i].group_number) {
                            // save and go to the next group
                            sectionBody.push({
                                type: contentType,
                                content: staticContent,
                                blocks: tempContent,
                            });
                            tempContent = [];
                            staticContent = {};
                            groupNumber = posts_contents[i].group_number;
                            contentType = posts_contents[i].group_type;

                        }

                        let data = {};

                        if (posts_contents[i].is_content) {
                            if (posts_contents[i].text) data.text = posts_contents[i].text;
                            if (posts_contents[i].ids) data.ids = JSON.parse(posts_contents[i].ids);
                            if (posts_contents[i].title) data.title = posts_contents[i].title;
                            if(posts_contents[i].video_link) data.video_link = posts_contents[i].video_link
                            if(posts_contents[i].image_left) data.image_left = (posts_contents[i].image_left ? true : false)
                            if (posts_contents[i].block_button_text) data.block_button_text = posts_contents[i].block_button_text;
                            if (posts_contents[i].block_button_link) data.block_button_link = posts_contents[i].block_button_link;
                            if(posts_contents[i].images && posts_contents[i].images.length){
                                let images = JSON.parse(posts_contents[i].images)
                                let images_result = await models.uploaded_files.findAll({
                                    where: {
                                        id: {
                                            [Op.in] : images
                                        }
                                    }
                                })
                                if(images_result && images_result.length){
                                    images_result = images_result.map((item) => item.toJSON())

                                    let arr = []
                                    images_result.forEach((item)=> arr.push({"block_image": item}))
                                    data.images = arr
                                }

                            }
                            staticContent = data;
                        } else {
                            if (posts_contents[i].block_image) data.block_image = posts_contents[i].block_image;
                            tempContent.push(data);
                        }
                    }
                    // save last items before end
                    if (i === posts_contents.length - 1) {
                        if (contentType || tempContent.length || Object.keys(staticContent).length || sectionBody.length) {
                            sectionBody.push({
                                type: contentType,
                                content: staticContent,
                                blocks: tempContent
                            });

                        }
                    }
                }
               // })


            result = sectionBody;
        }
        log.info(`End function convertPostBodyForFrontendFormat. DATA: ${JSON.stringify(result)}`);
        return result;
    },

    convertProductBodyForFrontendFormat: async (products_contents) => {
        log.info(`End function convertProductBodyForFrontendFormat`);
        try{
            let result = [];

            if (products_contents && products_contents.length) {

                let sectionBody = [];
                let groupNumber = null;
                let contentType;
                let tempContent = [];
                let staticContent = {};

                for(let i = 0; i<products_contents.length;i++ ){

                    if (products_contents[i].group_number) {
                        if (groupNumber === null) {
                            groupNumber = products_contents[i].group_number;
                            contentType = products_contents[i].group_type;
                        }

                        if (groupNumber !== products_contents[i].group_number) {
                            // save and go to the next group
                            sectionBody.push({
                                type: contentType,
                                content: staticContent,
                                blocks: tempContent,
                            });
                            tempContent = [];
                            staticContent = {};
                            groupNumber = products_contents[i].group_number;
                            contentType = products_contents[i].group_type;

                        }

                        let data = {};

                        if (products_contents[i].is_content) {
                            if (products_contents[i].text) data.text = products_contents[i].text;
                            if (products_contents[i].ids) data.ids = JSON.parse(products_contents[i].ids);
                            if (products_contents[i].title) data.title = products_contents[i].title;
                            if(products_contents[i].video_link) data.video_link = products_contents[i].video_link
                            if(products_contents[i].image_left) data.image_left = (products_contents[i].image_left ? true : false)
                            if (products_contents[i].block_button_text) data.button_text = products_contents[i].block_button_text;
                            if (products_contents[i].block_button_link) data.button_link = products_contents[i].block_button_link;
                            if(products_contents[i].images && products_contents[i].images.length){
                                let images = JSON.parse(products_contents[i].images)
                                let images_result = await models.uploaded_files.findAll({
                                    where: {
                                        id: {
                                            [Op.in] : images
                                        }
                                    }
                                })
                                if(images_result && images_result.length){
                                    images_result = images_result.map((item) => item.toJSON())

                                    let arr = []
                                    images_result.forEach((item)=> arr.push({"block_image": item}))
                                    data.images = arr
                                }

                            }
                            staticContent = data;
                        } else {
                            if (products_contents[i].block_image) data.block_image = products_contents[i].block_image;
                            tempContent.push(data);
                        }
                    }
                    // save last items before end
                    if (i === products_contents.length - 1) {
                        if (contentType || tempContent.length || Object.keys(staticContent).length || sectionBody.length) {
                            sectionBody.push({
                                type: contentType,
                                content: staticContent,
                                blocks: tempContent
                            });
                        }
                    }
                }

                result = sectionBody;
            }
            log.info(`End function convertProductBodyForFrontendFormat.`);
            return result;

        }catch(error){
            log.error(`${error}`);
            throw error;
        }
    },

    generateLinkUrlForPage: (pageType, pageslug, pageTemplate, lang) => {
        log.info(`Start generateLinkUrlForPage data:${JSON.stringify(pageType, pageslug, pageTemplate)}`)
        let url;
        if (pageType === "dealer") {
            url =  `/about-dealer/${pageslug}`;
        } else {
            switch (pageTemplate) {
                case "blog":
                    url = `/blog/${pageslug}`;
                    break;
                case "catalog":
                    url = `/shop/getCategory/${pageslug}`;
                    break;
                case 'product':
                    url = `/shop/getProduct/${pageslug}`;
                    break;
                case 'promotions':
                    url = `/promotions/${pageslug}`;
                    break;
                case 'promotions_products':
                    url = `/shop/getPromotionsProducts/${pageslug}`;
                    break;
                case 'collections':
                    url = `/shop/getCategories/${pageslug}`;
                    break;
                case 'faq':
                    url=  `/faq/${pageslug}` ;
                    break;
                case 'service':
                    url=  `/shop/getService/${pageslug}` ;
                    break;
                case 'service_category':
                    url=  `/shop/getServiceCategory/${pageslug}` ;
                    break;
                case 'services':
                    url=  `/shop/catalog/${pageslug}` ;
                    break;
                default:
                    url = `/getPage/${pageslug}`;
            }
        }
        log.info(`End generateLinkUrlForPage data:${JSON.stringify(url)}`)
        return url;
    },
    convertNotificationFilterToPrettyString: (filter) => {
        log.info(`Start function convertNotificationFilterToPrettyString. DATA: ${JSON.stringify(filter)}`)
        let result = '';
        if (filter) {
            if (typeof filter === 'string') filter = JSON.parse(filter);

            if (filter.search) result = result + `Пошук: ${filter.search}; `;
            // if (filter.gender) result = result + `Стать: ${config.GENDER[filter.gender]}; `;
            // if (filter.age && (filter.age.from || filter.age.to)) {
            //     if (filter.age.from && !filter.age.to) result = result + `Вік: від ${filter.age.from} років; `;
            //     if (!filter.age.from && filter.age.to) result = result + `Вік: до ${filter.age.to} років; `;
            //     if (filter.age.from && filter.age.to) result = result + `Вік: ${filter.age.from}-${filter.age.to} років; `;
            // }
            //if (filter.contact_by) result = result + `Тип розсилки: ${filter.contact_by}; `;
            if (filter.city) result = result + `Місто: ${filter.city}; `;
            if (filter.street) result = result + `Вулиця: ${filter.street}; `;
            // if (filter.mariage_status) result = result + `Сімейний статус: ${config.MARIAGE_STATUS[filter.mariage_status]}; `;
            // if (filter.child_count) result = result + `К-ть дітей: ${config.CHILD_COUNT[filter.child_count]}; `;
            // if (filter.car_status) result = result + `Автомобіль: ${filter.car_status ? 'є' : 'немає'}; `;
            // if (filter.social_status) result = result + `Соціальний статус: ${config.SOCIAL_STATUS[filter.social_status]}; `;
            // if (filter.count_receipt_week && (filter.count_receipt_week.from || filter.count_receipt_week.to)) {
            //     if (filter.count_receipt_week.from && !filter.count_receipt_week.to) result = result + `К-ть чеків на тиждень: від ${filter.count_receipt_week.from}; `;
            //     if (!filter.count_receipt_week.from && filter.count_receipt_week.to) result = result + `К-ть чеків на тиждень: до ${filter.count_receipt_week.to}; `;
            //     if (filter.count_receipt_week.from && filter.count_receipt_week.to) result = result + `К-ть чеків на тиждень: ${filter.count_receipt_week.from}-${filter.count_receipt_week.to}; `;
            // }
            // if (filter.count_receipt_month && (filter.count_receipt_month.from || filter.count_receipt_month.to)) {
            //     if (filter.count_receipt_month.from && !filter.count_receipt_month.to) result = result + `К-ть чеків на місяць: від ${filter.count_receipt_month.from}; `;
            //     if (!filter.count_receipt_month.from && filter.count_receipt_month.to) result = result + `К-ть чеків на місяць: до ${filter.count_receipt_month.to}; `;
            //     if (filter.count_receipt_month.from && filter.count_receipt_month.to) result = result + `К-ть чеків на місяць: ${filter.count_receipt_month.from}-${filter.count_receipt_month.to}; `;
            // }

            // if (filter.average_receipt_week && (filter.average_receipt_week.from || filter.average_receipt_week.to)) {
            //     if (filter.average_receipt_week.from && !filter.average_receipt_week.to) result = result + `Середній чек на тиждень: від ${filter.average_receipt_week.from}; `;
            //     if (!filter.average_receipt_week.from && filter.average_receipt_week.to) result = result + `Середній чек на тиждень: до ${filter.average_receipt_week.to}; `;
            //     if (filter.average_receipt_week.from && filter.average_receipt_week.to) result = result + `Середній чек на тиждень: ${filter.average_receipt_week.from}-${filter.average_receipt_week.to}; `;
            // }
            // if (filter.average_receipt_month && (filter.average_receipt_month.from || filter.average_receipt_month.to)) {
            //     if (filter.average_receipt_month.from && !filter.average_receipt_month.to) result = result + `Середній чек на місяць: від ${filter.average_receipt_month.from}; `;
            //     if (!filter.average_receipt_month.from && filter.average_receipt_month.to) result = result + `Середній чек на місяць: до ${filter.average_receipt_month.to}; `;
            //     if (filter.average_receipt_month.from && filter.average_receipt_month.to) result = result + `Середній чек на місяць: ${filter.average_receipt_month.from}-${filter.average_receipt_month.to}; `;
            // }
            // if (filter.product_turnover_month && (filter.product_turnover_month.from || filter.product_turnover_month.to)) {
            //     if (filter.product_turnover_month.from && !filter.product_turnover_month.to) result = result + `ТО на місяць: від ${filter.product_turnover_month.from}; `;
            //     if (!filter.product_turnover_month.from && filter.product_turnover_month.to) result = result + `ТО на місяць: до ${filter.product_turnover_month.to}; `;
            //     if (filter.product_turnover_month.from && filter.product_turnover_month.to) result = result + `ТО на місяць: ${filter.product_turnover_month.from}-${filter.product_turnover_month.to}; `;
            // }
            // if (filter.is_new_user || filter.is_new_user === 0 ) result = result + `${filter.is_new_user ? 'Новий учасник' : 'Старий учасник'}; `;
            // if (filter.card_status || filter.card_status === 0 ) result = result + `Статус карти: ${filter.card_status ? 'Активна' : 'Неактивна'}; `;
        }
        log.info(`End function convertNotificationFilterToPrettyString. DATA: ${JSON.stringify(result)}`)
        return result;
    },
    checkUpdateLangByObject: async(data,model,type)=>{
        log.info(`Start function checkUpdateLangByObject. DATA: ${JSON.stringify(data)}`)
        if (data  && data.length){
            let allProducts =[]
            for(let item of data){
                let lang_change = await model.findAll({
                    where:{
                        [Op.or]:[
                            {id:item.id},
                            {origin_id:item.id}
                        ]
                    },
                    attributes:['id','origin_id','lang']
                })
                lang_change = lang_change.map(i => i.toJSON())
                let change ={}
                for(let id of lang_change){
                    id.history = await models.admin_changes_history.findAll({
                        where:{
                            item_id:id.id ,type:type
                        }
                    })
                    if(id.lang === "uk"){
                        if(id.history.length >1) {
                            change.uk = true
                        }else{
                            change.uk = false
                        }
                    }
                    if(id.lang === "en"){
                        if(id.history.length >1) {
                            change.en = true
                        }else{
                            change.en = false
                        }
                    }
                }
                item.change = change

                allProducts.push(item)
            }
            data = allProducts
        }
        return data
    },
    parseXmlToJson: parseXmlToJson
}
