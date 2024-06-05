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

    // Ambil akun yang di-follow oleh kompetitor
    async function getFollowingAccounts(competitorUrl) {
        await page.goto(competitorUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('a[href$="/following/"]', { visible: true });
        
        // Klik link following
        await page.click('a[href$="/following/"]');
        await page.waitForSelector('ul div li', { visible: true });

        console.log('Mengambil daftar following...');
        let followingAccounts = [];
        let previousHeight = 0;

        while (followingAccounts.length < 25) {
            const newFollowing = await page.$$eval('ul div li div div div div span a', anchors => anchors.map(anchor => anchor.textContent));
            followingAccounts = [...new Set([...followingAccounts, ...newFollowing])];

            const newHeight = await page.evaluate('document.querySelector("ul").scrollHeight');
            if (newHeight === previousHeight) break;

            previousHeight = newHeight;
            await page.evaluate('document.querySelector("ul").scrollTop = document.querySelector("ul").scrollHeight');
            await page.waitForTimeout(2000); // Tunggu 2 detik
        }

        return followingAccounts.slice(0, 25);
    }

    // Kirim pesan ke akun-akun
    async function sendMessage(accounts, message) {
        for (let account of accounts) {
            await page.goto(`https://www.instagram.com/${account}/`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('button', { visible: true });

            // Klik tombol pesan
            const buttons = await page.$$('button');
            for (let button of buttons) {
                const text = await (await button.getProperty('innerText')).jsonValue();
                if (text.toLowerCase().includes('message')) {
                    await button.click();
                    break;
                }
            }
            
            await page.waitForSelector('textarea', { visible: true });
            await page.type('textarea', message);
            await page.keyboard.press('Enter');
            console.log(`Pesan terkirim ke ${account}`);
            await page.waitForTimeout(2000); // Tunggu 2 detik antara pesan
        }
    }

    // Kredensial Anda dan detail lainnya
    const username = 'graphicskyutee';
    const password = 'in$t@_kyu100%';
    const competitorUrl = 'https://www.instagram.com/competitor_account/';
    const message = 'Halo, kami ingin memperkenalkan produk baru kami!';

    // Login dan lakukan tugas
    try {
        await loginInstagram(username, password);
        const followingAccounts = await getFollowingAccounts(competitorUrl);
        console.log(`Akun yang di-follow: ${followingAccounts.length}`);
        
        // Output list akun ke file
        fs.writeFileSync('followingAccounts.json', JSON.stringify(followingAccounts, null, 2));
        console.log('Akun yang dipilih:', followingAccounts);
        
        await sendMessage(followingAccounts, message);

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    } finally {
        // Tutup browser
        await browser.close();
    }
})();
