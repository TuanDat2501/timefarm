import querystring from 'querystring';
import { countdown, randomInt, getConfig, contentId, sleep, getData } from './utils.js';
import { cyan, yellow, blue, green } from 'console-log-colors';
import AxiosHelpers from "./helpers/axiosHelper.js";
import { JSDOM } from 'jsdom';

//config @cuadev
const accounts = getData("data.txt");
const proxies = getData("proxy.txt");

let timeRerun = 60;
let x_cv = '622'
//end config


function executeScript(jsCode) {
    const cleanedCode = jsCode
        .replace("(function() {", '')
        .replace("})();", '');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Document</title>
    </head>
    <body>
        <div id="_chr_"></div>
    </body>
    </html>
    `;

    const dom = new JSDOM(html);
    const { document } = dom.window;

    const scriptFunction = new Function('document', `
        ${cleanedCode}
    `);

    const result = scriptFunction(document);
    return result;
}

function executeChqService(value) {
    const len = value.length;
    const bytes = new Uint8Array(len / 2);
    const x = 157;
        for (let t = 0; t < len; t += 2)
            bytes[t / 2] = parseInt(value.substring(t, t + 2), 16);
        const xored = bytes.map(t=>t ^ x)
          , decoded = new TextDecoder().decode(xored);
        
         let code =  executeScript(decoded);

        return (code)
}

function createAxiosInstance(proxy) {
    return new AxiosHelpers({
        headers: {
            "accept": "/",
            "accept-language": "en-US,en;q=0.9,fa;q=0.8",
            "content-type": "application/json",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "X-Cv": x_cv,
            "X-Bot": "no",
            "X-App": "tapswap_server",
            "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36"
        },
        proxy: proxy ? proxy : false
    });
}


async function authToken(url,axios) {

    const conf = getConfig();
    const auto_upgrade = conf.auto_upgrade;

    let headers = {};

    const payload = {
        init_data: querystring.unescape(url).split('tgWebAppData=')[1].split('&tgWebAppVersion')[0],
        referrer: ""
    };

    let response1,response,balance,energy,name,token,chr;

    try{
        response1 = await axios.post('https://api.tapswap.ai/api/account/login', payload, { headers: headers });
    } catch (error) {
        console.error("[!] Error in auth1:  ", error);
    }
    if(response1.data.chq){
        let code = executeChqService(response1.data.chq);
        payload.chr = code;
        while (true) {
            try {
                response = await axios.post('https://api.tapswap.ai/api/account/login', payload, { headers: headers });
                break;
            } catch (error) {
                console.error("[!] Error in auth:  ", error);
            }
        }

        if(auto_upgrade){
            try {
                await checkUpdate(response.data, axios);
            } catch (e) {
                console.error("[!] Error in auto_upgrade:  ", e);
            }
        }

        return response.data;
    }
    return null;
}

async function checkUpdate(rs, axios) {
    try {
        const conf = getConfig();
        const max_charge_level = conf.max_charge_level;
        const max_energy_level = conf.max_energy_level;
        const max_tap_level = conf.max_tap_level;

        let charge_level = rs.player.charge_level;
        let energy_level = rs.player.energy_level;
        let tap_level = rs.player.tap_level;
        let shares = rs.player.shares;
        let auth = rs.access_token;

        if (charge_level < max_charge_level) {
            let price = 0;
            while (shares >= price) {
                for (const item of rs.conf.charge_levels) {
                    if (item.rate === charge_level + 1) {
                        price = item.price;
                    }
                }

                if (price > shares || charge_level >= max_charge_level) {
                    break;
                }

                console.log(yellow.bold('[+] Upgrade Charge Level'));
                await upgrade(auth, 'charge', axios);
                shares -= price;
                charge_level += 1;
            }
        }

        if (energy_level < max_energy_level) {
            let price = 0;
            while (shares >= price) {
                for (const item of rs.conf.energy_levels) {
                    if (item.limit === (energy_level + 1) * 500) {
                        price = item.price;
                    }
                }

                if (price > shares || energy_level >= max_energy_level) {
                    break;
                }

                await upgrade(auth, 'energy', axios);
                shares -= price;
                energy_level += 1;
            }
        }

        if (tap_level < max_tap_level) {
            let price = 0;
            while (shares >= price) {
                for (const item of rs.conf.tap_levels) {
                    if (item.rate === tap_level + 1) {
                        price = item.price;
                    }
                }

                if (price > shares || tap_level >= max_tap_level) {
                    break;
                }

                await upgrade(auth, 'tap', axios);
                shares -= price;
                tap_level += 1;
            }
        }
    } catch (e) {
        console.log(`Err checkUpdate: ${e}`);
    }
}

async function upgrade(auth, type = "charge", axios) {
    try {
        const headers = {
            "Authorization": `Bearer ${auth}`,
        };

        const payload = { type: type };

        const response = await axios.post('https://api.tapswap.ai/api/player/upgrade', payload, { headers: headers });

        if (response.data.message && response.data.message === 'not_enough_shares') {
            return response.data;
        }

        const charge_level = response.data.player.charge_level;
        const energy_level = response.data.player.energy_level;
        const tap_level = response.data.player.tap_level;

        console.log(blue.bold(`[*] Upgrade | Charge Lv: ${charge_level} | Energy Lv: ${energy_level} | Tap Lv: ${tap_level}`));

        return response.data;
    } catch (e) {
        console.log(e);
        console.log(`Err upgrade: ${e}`);
    }
}

async function submitTaps(axios, taps, userId, auth, timex = Date.now()) {
    try {
        const headers = {
            "Authorization": `Bearer ${auth}`,
            "Content-Id": (contentId(userId, timex)).toString(),
        };

        const payload = { taps: taps, time: timex };

        while (true) {
            try {
                const response = await axios.post('https://api.tapswap.ai/api/player/submit_taps', payload, { headers: headers });
                await sleep(randomInt(2, 5));
                return response.data;
            } catch (error) {
                console.error("[!] Error in Tapping: ", error);
            }
        }
    } catch (e) {
        console.log(`Err Submit taps: ${e}`);
    }
}

async function applyBoost(axios, auth, type = 'energy') {
    // Types: turbo, energy
    const headers = {
        "Authorization": `Bearer ${auth}`,
    };
    const payload = { type: type };

    try {
        const response = await axios.post('https://api.tapswap.ai/api/player/apply_boost', payload, { headers: headers });
        return response.data;
    } catch (error) {
        console.error('Error applying boost:', error);
        // throw error;
    }
}

async function turboTaps(auth, userId, axios) {
    try {
        const xtap = await submitTaps(axios, randomInt(84, 96), userId, auth);
        for (const boost of xtap.player.boost) {
            if (boost.type === 'turbo' && boost.end > Date.now() / 1000) {
                console.log(yellow("[+] Turbo Tapping!"));
                for (let i = 0; i < randomInt(8, 10); i++) {
                    const taps = randomInt(84, 86);
                    const xtap = await submitTaps(axios, taps, userId, auth);
                    const { energy, tap_level, shares } = xtap.player;
                    console.log(cyan(`[+] Turbo: ${taps} taps! - Point : ${shares} \r`));
                    await new Promise(resolve => setTimeout(resolve, randomInt(1, 3) * 1000));
                    if (!(boost.end > Date.now() / 1000)) {
                        break;
                    }
                }
            }
        }
    } catch (e) {
        console.log(`Err Submit taps: ${e}`);
    }
}

async function claimReward(auth, taskId, axios) {
    const headers = {
        "Authorization": `Bearer ${auth}`,
    };

    const payload = { task_id: taskId };

    try {
        const response = await axios.post('https://api.tapswap.ai/api/player/claim_reward', payload, { headers: headers });
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function sendTaps(data, axios) {
    try {
        let token = data.access_token;
        let userId = data.player.id;
        let mining = true;
        let nextMineTime;
        let balance;
        let fullTank;

        let xtap = await submitTaps(axios, 1, userId, token);
        let energy = xtap.player.energy;
        let tapLevel = xtap.player.tap_level;
        let energyLevel = xtap.player.energy_level;
        let chargeLevel = xtap.player.charge_level;
        let shares = xtap.player.shares;

        if (energy >= (energyLevel * 500) - (tapLevel * randomInt(4, 12))) {
            console.log(yellow(`[+] Account ${data.accountRun}: Start Taps!!`));

            while (energy > tapLevel) {
                const maxClicks = Math.min(Math.round(energy / tapLevel) - 1, randomInt(70, 96));
                const taps = maxClicks;

                if (taps < 1) {
                    break;
                }

                console.log(green.bold(`[+] Account ${data.accountRun}: Sending ${taps} taps - Point : ${shares}`));
                const xtap = await submitTaps(axios, taps, userId, token);
                energy = xtap.player.energy;
                tapLevel = xtap.player.tap_level;
                shares = xtap.player.shares;

                if (tapLevel > 1) {
                    await new Promise(resolve => setTimeout(resolve, randomInt(1, 3) * 1000));
                }

                if (energy <= 50 || energy < tapLevel * 3) {
                    break;
                }

                balance = shares;
            }

            //
            for (const boost of xtap.player.boost) {
                if (boost.type === 'energy' && boost.cnt > 0) {
                    console.log(yellow(`[+] Account ${data.accountRun}: Active FullTank!!`));
                    await applyBoost(axios, token);
                    fullTank = true;
                    break;
                }

                if (boost.type === 'turbo' && boost.cnt > 0) {
                    console.log(yellow(`[+] Account ${data.accountRun}: Active Turbo!!`));
                    await applyBoost(axios, token, 'turbo');
                    await turboTaps(token, userId, axios);
                    fullTank = true;
                    break;
                }
            }

            for (const claim of xtap.player.claims) {
                console.log(yellow(`[+] Account ${data.accountRun}: Claim reward: ${claim} !!`));
                claimReward(token, claim, axios);
            }

        }else{
            console.log(`[+] Account ${data.accountRun}: Taps waiting...`)
        }

        mining = false;
    } catch (e) {
        console.log(`Err Submit taps: ${e}`);
    }
}

async function checkIP(axios) {
    try {
        const rs = await axios.get("https://api.myip.com");
        const ip = rs.data?.ip;
        const country = rs.data?.country;
        return `${ip} - Country: ${country}`;
    } catch (err) {
        console.log("err checkip: ", err);
        return null;
    }
}

async function runMulti() {
    let proxy = null;
    const tasks = accounts.map(async (account, index) => {
        if (proxies.length > 0) {
            proxy = proxies[index % proxies.length];
        }

        if (account) {
            const axiosInstance = createAxiosInstance(proxy);

            console.log(`[#] Account: ${index + 1}, Proxy: ${proxy}`);
            console.log(`[#] Account: ${index + 1} Check IP...`);
            let checkIp = await checkIP(axiosInstance);
            console.log(`[#] Account: ${index + 1} Run at IP: ${checkIp}`);

            let loginResult = await authToken(account,axiosInstance);
            if (loginResult && loginResult.player) {
                loginResult.accountRun = Number(index) + Number(1);
                let { name, energy, tap_level, shares } = loginResult.player;
                console.log(blue(`[+] Account: ${index + 1} - User: ${name} - Energy: ${energy} - Tap Level: ${tap_level} - Point: ${shares}`)
                );
                await sleep(randomInt(1, 2));
                await sendTaps(loginResult,axiosInstance);
                await sleep(randomInt(5, 10));
            }
        }
    });
    console.log(tasks.length);

    await Promise.all(tasks);
}


async function mainLoopMutil() {

    while (true) {
        await runMulti();
        await countdown(timeRerun * 30);
    }
}

mainLoopMutil();
