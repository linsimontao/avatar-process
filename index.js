const Axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const file='player';
//const file='player1500';
const players = require(`./${file}.json`);

// new image url
const url = 'https://tdt-avatars.s3.ap-northeast-1.amazonaws.com/';

// download and resize Image
const resizeImg = async (url, id) => {
    const transfrom = sharp().resize(100, 100);

    const res = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        res.data
            .pipe(transfrom)
            .pipe(fs.createWriteStream(`./pics/${id}.png`))
            .on('error', reject)
            .once('close', () => { resolve(id) })
    });
}

const resultPromises = [];
players.map(p => {
    resultPromises.push(resizeImg(p.avatar_url, p.id))
});

const alpha = id => {
    sharp(`./pics/${id}.png`)
        .ensureAlpha()
        .composite([{ input: 'a.svg', blend: 'dest-in' }])
        .toFile(`./out/${id}.png`);
}

Promise.all(resultPromises)
    .then(idList => {
        idList.map(alpha);

        const newjson = players.map(p => {
            return {
                ...p,
                new_avatar_url: `${url}${p.id}.png`
            }
        })

        // add new avatar url to json file
        fs.writeFileSync(`./${file}.json`, JSON.stringify(newjson));
    })
    .catch (err => {
        console.error(err);
    });

