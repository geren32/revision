const sharp = require("sharp");


module.exports = async(baseImg, arrayOfImagesPath) => {
    
    let layers = []

    arrayOfImagesPath.forEach(item => {
        layers.push({"input" : item})
    });

    try {
        let imageBlob = await sharp(baseImg)
            .composite(layers)
            .png()
            .toBuffer();
        //.toFile(`${__dirname}/public/img/test15.png`);
        return imageBlob

    } catch (error) {
        console.log(error);
        throw error
    }
}
 
