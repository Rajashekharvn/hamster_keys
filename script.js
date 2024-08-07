document.addEventListener('DOMContentLoaded', () => {
    const EVENTS_DELAY = 20000;

    const games = {
        1: {
            name: 'Riding Extreme 3D',
            appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50',
            promoId: '43e35910-c168-4634-ad4f-52fd764a843f',
        },
        2: {
            name: 'Chain Cube 2048',
            appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
            promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3',
        },
        3: {
            name: 'My Clone Army',
            appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
            promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767',
        },
        4: {
            name: 'Train Miner',
            appToken: '82647f43-3f87-402d-88dd-09a90025313f',
            promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954',
        }
    };

    const startBtn = document.getElementById('startBtn');
    const keyCountLabel = document.getElementById('keyCountLabel');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressLog = document.getElementById('progressLog');
    const keyContainer = document.getElementById('keyContainer');
    const keysList = document.getElementById('keysList');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const generatedKeysTitle = document.getElementById('generatedKeysTitle');
    const copyStatus = document.getElementById('copyStatus');
    const telegramChannelBtn = document.getElementById('telegramChannelBtn');

    const radioButtons = document.querySelectorAll('input[name="game"]');

    startBtn.addEventListener('click', async () => {
        const selectedGames = Array.from(radioButtons)
            .filter(button => button.checked)
            .map(button => parseInt(button.value));

        if (selectedGames.length === 0) {
            alert('Please select at least one game.');
            return;
        }

        const keyCount = 4; // Fixed key count as per the requirement
        keyCountLabel.innerText = `Number of keys: ${keyCount}`;

        progressBar.style.width = '0%';
        progressText.innerText = '0%';
        progressLog.innerText = 'Starting...';
        progressContainer.classList.remove('hidden');
        keyContainer.classList.add('hidden');
        generatedKeysTitle.classList.add('hidden');
        keysList.innerHTML = '';
        radioButtons.forEach(button => button.parentElement.classList.add('hidden'));
        startBtn.classList.add('hidden');
        copyAllBtn.classList.add('hidden');
        startBtn.disabled = true;

        let progress = 0;
        const updateProgress = (increment, message) => {
            progress = Math.min(progress + increment, 100);
            progressBar.style.width = `${progress}%`;
            progressText.innerText = `${progress}%`;
            progressLog.innerText = message;
        };

        const generateKeysForGame = async (game) => {
            const keys = [];
            for (let i = 0; i < 4; i++) {
                const clientId = generateClientId();
                let clientToken;
                try {
                    clientToken = await login(clientId, game.appToken);
                } catch (error) {
                    alert(`Failed to login: ${error.message}`);
                    startBtn.disabled = false;
                    return [];
                }

                for (let j = 0; j < 11; j++) {
                    await sleep(EVENTS_DELAY * delayRandom());
                    const hasCode = await emulateProgress(clientToken, game.promoId);
                    updateProgress(7 / selectedGames.length, 'Emulating progress...');
                    if (hasCode) {
                        break;
                    }
                }

                try {
                    const key = await generateKey(clientToken, game.promoId);
                    updateProgress(30 / selectedGames.length, 'Generating key...');
                    keys.push(key);
                } catch (error) {
                    alert(`Failed to generate key: ${error.message}`);
                    return [];
                }
            }
            return keys;
        };

        const allKeys = await Promise.all(selectedGames.map(gameId => generateKeysForGame(games[gameId])));

        const filteredKeys = allKeys.flat().filter(key => key);

        if (filteredKeys.length > 1) {
            keysList.innerHTML = filteredKeys.map(key =>
                `<div class="key-item">
                    <input type="text" value="${key}" readonly>
                    <button class="copyKeyBtn" data-key="${key}">Copy Key</button>
                </div>`
            ).join('');
            copyAllBtn.classList.remove('hidden');
        } else if (filteredKeys.length === 1) {
            keysList.innerHTML =
                `<div class="key-item">
                    <input type="text" value="${filteredKeys[0]}" readonly>
                    <button class="copyKeyBtn" data-key="${filteredKeys[0]}">Copy Key</button>
                </div>`;
        }

        keyContainer.classList.remove('hidden');
        generatedKeysTitle.classList.remove('hidden');
        document.querySelectorAll('.copyKeyBtn').forEach(button => {
            button.addEventListener('click', (event) => {
                const key = event.target.getAttribute('data-key');
                navigator.clipboard.writeText(key).then(() => {
                    copyStatus.classList.remove('hidden');
                    setTimeout(() => copyStatus.classList.add('hidden'), 2000);
                });
            });
        });
        copyAllBtn.addEventListener('click', () => {
            const keysText = filteredKeys.join('\n');
            navigator.clipboard.writeText(keysText).then(() => {
                copyStatus.classList.remove('hidden');
                setTimeout(() => copyStatus.classList.add('hidden'), 2000);
            });
        });

        progressBar.style.width = '100%';
        progressText.innerText = '100%';
        progressLog.innerText = 'Complete';

        startBtn.classList.remove('hidden');
        radioButtons.forEach(button => button.parentElement.classList.remove('hidden'));
        startBtn.disabled = false;
    });

    document.getElementById('generateMoreBtn').addEventListener('click', () => {
        progressContainer.classList.add('hidden');
        keyContainer.classList.add('hidden');
        startBtn.classList.remove('hidden');
        radioButtons.forEach(button => button.parentElement.classList.remove('hidden'));
        generatedKeysTitle.classList.add('hidden');
        copyAllBtn.classList.add('hidden');
        keysList.innerHTML = '';
        keyCountLabel.innerText = 'Number of keys:';
    });

    document.getElementById('creatorChannelBtn').addEventListener('click', () => {
        window.open('https://telegram.me/HamsterKeyTool_bot', '_blank');
    });

    telegramChannelBtn.addEventListener('click', () => {
        window.open('https://telegram.me/PS_BOTz', '_blank');
    });

    const generateClientId = () => {
        const timestamp = Date.now();
        const randomNumbers = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
        return `${timestamp}-${randomNumbers}`;
    };

    const login = async (clientId, appToken) => {
        const response = await fetch('https://api.gamepromo.io/promo/login-client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appToken,
                clientId,
                clientOrigin: 'deviceid'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to login');
        }

        const data = await response.json();
        return data.clientToken;
    };

    const emulateProgress = async (clientToken, promoId) => {
        const response = await fetch('https://api.gamepromo.io/promo/register-event', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                promoId,
                eventId: generateUUID(),
                eventOrigin: 'undefined'
            })
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.hasCode;
    };

    const generateKey = async (clientToken, promoId) => {
        const response = await fetch('https://api.gamepromo.io/promo/create-code', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                promoId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate key');
        }

        const data = await response.json();
        return data.promoCode;
    };

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0,
                  v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const delayRandom = () => Math.random() * (1.5 - 0.5) + 0.5; // Random delay between 0.5 and 1.5
});
