const fs = require('fs');
const https = require('https');
const process = require('process');

const cities = require('./cities');
const infoUrl = (index) => `https://travel.state.gov/content/travel/resources/database/database.getVisaWaitTimes.html?cid=${index}&aid=VisaWaitTimesHomePage`;

const filename = process.argv.length === 3 ? process.argv[2] : 'index.csv';
console.log(`Selected file: ${filename} (To change it run "node index.js filename")`);

const infos = cities.map((city) => new Promise((resolve) => {
    getInfo(city.code)
        .then((data) => {
            resolve({
                name: city.value,
                data: data,
                error: null
            });
        })
        .catch((error) => {
            console.log(`Unable to get info about ${city.value}: ${error}`);
            resolve({
                name: city.value,
                data: [],
                error: error
            });
        });
}));

Promise.all(infos).then((results) => {
    const table = [
        [
            'City name',
            'Visitor Visa',
            'Student/Exchange Visitor Visas',
            'All Other Nonimmigrant Visas',
            'Comment'
        ]
    ];

    results.map(resultToRow).forEach((row) => {
        table.push(row);
    });

    const csv = table.map((row) => row.join(',')).join('\n');
    fs.writeFileSync(filename, csv);
});

function resultToRow(result) {
    const row = [];

    row.push(result.name);

    for(let i = 0; i < 3; i++) {
        if (result.data[i]) {
            row.push(result.data[i]);
        } else {
            row.push('');
        }
    }

    row.push(result.error ? result.error : '');

    return row;
}

function getInfo(index) {
     return new Promise((resolve, reject) => {
        https.get(infoUrl(index), (response) => {
            let str = '';

            response.on('data', (chunk) => {
                str += chunk;
            });

            response.on('end', () => {
                resolve(str.trim().split(','));
            });

            response.on('error', (error) => {
                reject(error);
            })
        });
    });
}

