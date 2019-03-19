let iconv = require('iconv-lite');
let csv = require('fast-csv');
let fs = require('fs');
let mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'owucrmdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function readCsv(path) {
    return new Promise((resolve, reject) => {
        let fileStream = fs.createReadStream(`./xxx/${path}`);
        let arr = [];
        let csvStream = csv({objectMode: true, delimiter: ';'})
            .on("data", function (data) {
                if (data) {
                    let obj = null;
                    let phone = data[0] ? data[0].replace(/'/, '') : '';
                    let fullname = data[1] ? data[1].split(' ') : ['', ''];
                    let email = data[2] ? data[2].replace(/'/, '') : '';
                    if (phone || fullname || email.indexOf('@') > -1) {
                        obj = {
                            name: fullname[0] && !fullname[1] ? fullname[0].trim().replace(/'/, '') : fullname[1].trim().replace(/'/, ''),
                            surname: fullname[0] && fullname[1] ? fullname[0].trim().replace(/'/, '') : '',
                            phone: phone.trim().replace(/'/, ''),
                            email: email.indexOf('@') > -1 ? email.trim().replace(/'/, '') : ''
                        };
                        arr.push(obj);
                    }
                }
            })
            .on("end", function () {
                resolve(arr);
            });
        fileStream.pipe(iconv.decodeStream('win1251')).pipe(csvStream);
    })
}

async function saveClients(clients) {
    let sql = `insert into client(name, surname, email, phone, createdAt, updatedAt)
               values `;
    for (const client of clients) {
        const part = `('${client.name}', '${client.surname}', '${client.email}', '${client.phone}', '2019-03-18 11:02:20', '2019-03-18 11:02:20'),`;
        sql += part;
    }
    sql = sql.trim();
    sql = sql.slice(0, sql.length - 1);
    sql += ';';
    console.log(sql);
    fs.writeFileSync('./clientdump.sql', sql, {});
    // await pool.promise().query(sql);
    console.log('ok');
}


fs.readdir('./xxx', async (err, files) => {
    let clients = [];
    for (const filePath of files) {
        let res = await readCsv(filePath);
        let count = (res).length;
        clients.push(...res);
    }
    await saveClients(clients)
});

