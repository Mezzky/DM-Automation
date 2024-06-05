const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Login ke Instagram
    async function loginInstagram(username, password) {
        await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[name="username"]', { visible: true });
        
        await page.type('input[name="username"]', username);
        await page.type('input[name="password"]', password);
        
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        console.log('Login berhasil');
    }

    // Ambil followers terbaru dari akun kompetitor
    async function getFollowers(competitorUrl, limit) {
        await page.goto(competitorUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('a[href$="/followers/"]', { visible: true });
        
        // Klik link followers
        await page.click('a[href$="/followers/"]');
        await page.waitForSelector('ul div li', { visible: true });

        console.log('Mengambil daftar followers...');
        let followers = [];
        let previousHeight = 0;

        while (followers.length < limit) {
            const newFollowers = await page.$$eval('ul div li div div div div span a', anchors => anchors.map(anchor => anchor.textContent));
            followers = [...new Set([...followers, ...newFollowers])];

            const newHeight = await page.evaluate('document.querySelector("ul").scrollHeight');
            if (newHeight === previousHeight) break;

            previousHeight = newHeight;
            await page.evaluate('document.querySelector("ul").scrollTop = document.querySelector("ul").scrollHeight');
            await page.waitForTimeout(2000); // Tunggu 2 detik
        }

        return followers.slice(0, limit);
    }

    // Ikuti akun-akun terbaru
    async function followAccounts(accounts) {
        for (let account of accounts) {
            await page.goto(`https://www.instagram.com/${account}/`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('button', { visible: true });

            // Klik tombol follow
            const buttons = await page.$$('button');
            for (let button of buttons) {
                const text = await (await button.getProperty('innerText')).jsonValue();
                if (text.toLowerCase().includes('follow')) {
                    await button.click();
                    console.log(`Mengikuti akun: ${account}`);
                    break;
                }
            }
            
            await page.waitForTimeout(2000); // Tunggu 2 detik antara follow
        }
    }

    // Kredensial Anda dan detail lainnya
    const username = 'graphicskyutee';
    const password = 'in$t@_kyu100%';
    const competitorUrl = 'https://www.instagram.com/competitor_account/';
    const numberOfFollowersToFollow = 100;

    // Login dan lakukan tugas
    try {
        await loginInstagram(username, password);
        const followers = await getFollowers(competitorUrl, numberOfFollowersToFollow);
        console.log(`Total followers ditemukan: ${followers.length}`);
        
        // Output list akun ke file
        fs.writeFileSync('followers.json', JSON.stringify(followers, null, 2));
        console.log('Akun yang dipilih:', followers);
        
        await followAccounts(followers);

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    } finally {
        // Tutup browser
        await browser.close();
    }
})();
