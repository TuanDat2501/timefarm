const { default: axios } = require("axios");
const logger = require('node-color-log');
const proxy_check = require('proxy-check');
const { getData } = require("./checkProxy");
const { Builder, Browser, By, Key, until, Options } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const proxies = getData("proxy.txt")
async function handleProxy(proxy) {
    const handleProxy = await proxy.split(':')
    return { ip: handleProxy[0], port: handleProxy[1] }
}
async function checkProxy(ip, port) {
    let result;
    const proxy1 = {
        host: ip,
        port: port,
    };
    // or
    // const proxy = 'y0adXjeO:pAzAHCr4@54.82.74.24:5557';
    await proxy_check(proxy1).then(r => {
        logger.color("green").log(`Proxy ${ip}:${port} success`)
        result = true;
    }).catch(e => {
        logger.color("red").log(`Proxy ${ip}:${port} ECONNRESET`)
        result = false;
    });
    return result
}
async function validate_init(index, ip, port) {
    try {
        const res = await axios.post("https://tg-bot-tap.laborx.io/api/v1/auth/validate-init/v2",
            {
                initData: "query_id=AAFJZcxhAAAAAEllzGGe8XHw&user=%7B%22id%22%3A1640785225%2C%22first_name%22%3A%22Tu%E1%BA%A5n%20%C4%90%E1%BA%A1t%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22tuandat2514%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1721026445&hash=7edc3b40d83cead3f98be9be6101631220dc090b5a62a6939faf967cc77b9720",
            }
            ,
            /* , {
                proxy: {
                    protocol: 'http',
                    host: ip,
                    port: port
                }
            } */
        )
        const token = res.data?.token;
        if (res.status === 200) {
            logger.color("green").log(`Account ${index + 1} : Login Success!`)
        }
        return token;
    } catch (error) {
        logger.color("red").log(`Account ${index + 1} : Login Failed!`)
    }
}
async function getInfo(token) {
    try {
        let info;
        const res = await axios.get("https://tg-bot-tap.laborx.io/api/v1/farming/info", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (res.status === 200) {
            logger.color("green").log(res.data)
        }
    } catch (error) {
        logger.color("red").log("getInfo ERROR!!!")
    }
}
async function getListTasks(index, token) {
    try {
        const res = await axios.get("https://tg-bot-tap.laborx.io/api/v1/tasks", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const listTasks = res.data;
        console.log(`List Tasks Account ${index + 1} : ${listTasks.length} task`);
        return listTasks
    } catch (error) {
        logger.color("red").log("getListTasks ERROR!!!")
    }
}
async function claim$(index, token) {
    try {
        const res = await axios.post("https://tg-bot-tap.laborx.io/api/v1/farming/finish", {}, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (res.status === 200) {
            logger.color("green").log(`Account ${index + 1} : Claim Success`)
        }
    } catch (error) {
        logger.color("red").log(`Account ${index + 1} : Claim Failed`)

    }
}
async function start$(index, token) {
    try {
        const res = await axios.post("https://tg-bot-tap.laborx.io/api/v1/farming/start", {}, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (res.status === 200) {
            logger.color("green").log(`Account ${index + 1} : Start Success`)
        }
    } catch (error) {
        logger.color("red").log(`Account ${index + 1} : Start Failed`)
    }


}
async function checkIP(proxy) {
    try {
        const rs = await axios.get("https://api.myip.com", {
            proxy: {
                protocol: 'http',
                host: proxy.ip,
                port: proxy.port
            }
        });
        const ip = rs.data.ip;
        console.log(`${ip}`);
        return `${ip}`;
    } catch (err) {
        console.log("err checkip");
        return null;
    }
}
async function claimTask(index, id_task, name_task, token) {
    try {
        const res = await axios.post(`https://tg-bot-tap.laborx.io/api/v1/tasks/${id_task}/claims`, {}, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (res.status === 200) {
            logger.color("green").log(`Account ${index + 1} - ${name_task} : Claim Success`)
        }
    } catch (err) {
        logger.color("red").log(`Account ${index + 1} - ${name_task} : Claim Failed`)
    }
}
async function submissions(index, id_task, name_task, token) {
    try {
        const res = await axios.post(`https://tg-bot-tap.laborx.io/api/v1/tasks/${id_task}/submissions`, {}, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (res.status === 200) {
            logger.color("green").log(`Account ${index + 1} - ${name_task} : Submissions Success`)
        }
    } catch (err) {
        logger.color("red").log(`Account ${index + 1} - ${name_task} : Submissions Failed`)
    }
}
async function runTool() {
    /* const t = proxies?.map(async (value, index) => {
        const x = await handleProxy(value)
        const statusProxy = await checkProxy(x.ip, x.port);
        const checkip = await checkIP(x);
        console.log(`[#] Run at IP: ${checkip}`);
         if (statusProxy) {
             const token = await validate_init(index,x.ip, x.port);
             //const claim = await claim$(index,token);
             const start = await start$(index,token)
         }

    })
    await Promise.all(t)
} */
    // const token = await validate_init(0, 0, 0);
    token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjExMjIxNjQsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjEwMzU3NjQsImF1ZCI6InRnLmFpLmpvYnMiLCJpc3MiOiJ0Zy5haS5qb2JzIiwic3ViIjoiMTY0MDc4NTIyNSIsImp0aSI6IjE0aXd6MjFqbHltczliMXoifQ.mrxeYEN8i5moE_P6zRVhKtYowK8oDH7E2HBfAsHGmpFw5Ii3s2rTnvQvlxxn1zQW3oxSU1jtdRDHxY94ONa5ire7WbaHj-u6L4p4jJY2YlmYimK-ljwkmZ15bRyIBzWlo4knCVC3XleYz-A4HHQQS86t9iuMmAs0Xc8FS85_z7hCH0wrNSOGk7Upl-1HqKFHlKkPpZ1-WDym8SC2bOni7CWNtTr0a-Y3kAOnr6DAFdPKEaQqYwxNG7gKIpMsBcnFBGY3HvEPvOg5B9uz0aeoHNFQhpmiOeDiCvJ-rj06mX2jwDt2WqAC1zYDxUSmUXkhm647P1YG5RNyBdlOs7p7ezlVGzU8661LqkbeHsBka8syyeTP9UvJPHuq1DPfToBPC5Wd8afo8sn2Wp-xx66Swi4FzOLpMcnVqCbk-OnfJ81mop9y5T3m3LZig68iObP2KKFUvuS9Q1zIZlaawt0oUgnrxtgQ23nfREDJj5lPT7BbaS6bZ78wR6NQhsMcfiZNFVTfoFskQcPsdJn_PCYceYu-950jU5UgIFRWnEj0xZkzj-MoDDdvp8SUmihb9kApnxzE0BvgCe2WBXr8AJf9F1gzhYbsi8YubkFB0lCBXcLcUNiIzgohmS0pvo13gL3GXyxyz7f7ppeUz8tWgJ2ELsbp7Gn42VADyyicmKX2M80"
    const claim = await claim$(0, token);
    const start = await start$(0, token);
    const listTasks = await getListTasks(0, token);
    for (let i = 0; i < listTasks.length; i++) {
        if (listTasks[i].submission?.status == "COMPLETED") {
            const res = await claimTask(0, listTasks[i].id, listTasks[i].title, token);
        }
        if (listTasks[i].submission?.status == "REJECTED" || !listTasks[i].submission) {
            const res = await submissions(0, listTasks[i].id, listTasks[i].title, token);
        }
    }
}

async function mainLoopMutil() {
    // get_query("a6fc01b6-d689-4022-81d0-384d3c367fe4")
    await runTool();
}
mainLoopMutil();