// 数据存储
const data = {
    participants: [],
    prizes: [],
    history: []
};

// 从本地存储加载数据
function loadData() {
    const saved = localStorage.getItem('lotteryData');
    if (saved) {
        Object.assign(data, JSON.parse(saved));
        renderAll();
    }
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('lotteryData', JSON.stringify(data));
}

// 添加参与者
function addParticipant() {
    const input = document.getElementById('participantInput');
    const name = input.value.trim();
    
    if (!name) {
        alert('请输入参与者名字');
        return;
    }
    
    if (data.participants.includes(name)) {
        alert('该参与者已存在');
        return;
    }
    
    data.participants.push(name);
    input.value = '';
    saveData();
    renderParticipants();
}

// 删除参与者
function removeParticipant(name) {
    const index = data.participants.indexOf(name);
    if (index > -1) {
        data.participants.splice(index, 1);
        saveData();
        renderParticipants();
    }
}

// 渲染参与者列表
function renderParticipants() {
    const container = document.getElementById('participantList');
    
    if (data.participants.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>还没有添加参与者</p></div>';
        return;
    }
    
    container.innerHTML = data.participants.map(name => `
        <div class="tag">
            <span class="tag-name">${name}</span>
            <button class="tag-remove" onclick="removeParticipant('${name}')" title="删除">✕</button>
        </div>
    `).join('');
}

// 添加奖项
function addPrize() {
    const prizeInput = document.getElementById('prizeInput');
    const countInput = document.getElementById('prizeCount');
    const prizeName = prizeInput.value.trim();
    const count = parseInt(countInput.value) || 1;
    
    if (!prizeName) {
        alert('请输入奖项名称');
        return;
    }
    
    if (data.prizes.some(p => p.name === prizeName)) {
        alert('该奖项已存在');
        return;
    }
    
    data.prizes.push({ name: prizeName, count: count });
    prizeInput.value = '';
    countInput.value = '1';
    saveData();
    renderPrizes();
}

// 删除奖项
function removePrize(name) {
    const index = data.prizes.findIndex(p => p.name === name);
    if (index > -1) {
        data.prizes.splice(index, 1);
        saveData();
        renderPrizes();
    }
}

// 渲染奖项列表
function renderPrizes() {
    const container = document.getElementById('prizeList');
    
    if (data.prizes.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎁</div><p>还没有添加奖项</p></div>';
        return;
    }
    
    container.innerHTML = data.prizes.map(prize => `
        <div class="tag">
            <span class="tag-name">${prize.name}</span>
            <span class="tag-count">${prize.count}</span>
            <button class="tag-remove" onclick="removePrize('${prize.name}')" title="删除">✕</button>
        </div>
    `).join('');
}

// 开始抽奖
function startLottery() {
    if (data.participants.length === 0) {
        alert('请先添加参与者');
        return;
    }
    
    if (data.prizes.length === 0) {
        alert('请先添加奖项');
        return;
    }
    
    // 验证总人数是否够
    const totalWinners = data.prizes.reduce((sum, p) => sum + p.count, 0);
    if (totalWinners > data.participants.length) {
        alert(`奖项总人数(${totalWinners})不能超过参与者总数(${data.participants.length})`);
        return;
    }
    
    // 执行抽奖
    const result = {};
    const availableParticipants = [...data.participants];
    
    // 为每个奖项抽取中奖者
    data.prizes.forEach(prize => {
        result[prize.name] = [];
        for (let i = 0; i < prize.count; i++) {
            if (availableParticipants.length === 0) break;
            const randomIndex = Math.floor(Math.random() * availableParticipants.length);
            const winner = availableParticipants.splice(randomIndex, 1)[0];
            result[prize.name].push(winner);
        }
    });
    
    // 显示结果
    displayResult(result);
    
    // 保存到历史记录
    addToHistory(result);
}

// 显示抽奖结果
function displayResult(result) {
    const resultDiv = document.getElementById('lotteryResult');
    const contentDiv = document.getElementById('resultContent');
    
    let html = '';
    for (const [prize, winners] of Object.entries(result)) {
        const winnersHtml = winners.map(w => `<span class="winner-badge">${w}</span>`).join('');
        html += `
            <div class="result-item">
                <span class="result-prize">🏷️ ${prize}</span>
                <div class="result-winner">${winnersHtml}</div>
            </div>
        `;
    }
    
    contentDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// 添加到历史记录
function addToHistory(result) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const summary = Object.entries(result)
        .map(([prize, winners]) => `${prize}: ${winners.join('、')}`)
        .join('; ');
    
    data.history.unshift({
        timestamp,
        summary,
        details: result
    });
    
    // 只保留最近100条记录
    if (data.history.length > 100) {
        data.history.pop();
    }
    
    saveData();
    renderHistory();
}

// 渲染历史记录
function renderHistory() {
    const container = document.getElementById('historyList');
    
    if (data.history.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p>还没有抽奖记录</p></div>';
        return;
    }
    
    container.innerHTML = data.history.map((item, index) => `
        <div class="history-item">
            <div class="history-time">⏰ ${item.timestamp}</div>
            <div class="history-content">
                ${Object.entries(item.details)
                    .map(([prize, winners]) => `<div class="history-line">🏷️ <strong>${prize}</strong>: ${winners.join('、')}</div>`)
                    .join('')}
            </div>
        </div>
    `).join('');
}

// 重置
function resetLottery() {
    if (confirm('确定要重置所有数据吗？')) {
        data.participants = [];
        data.prizes = [];
        data.history = [];
        saveData();
        renderAll();
        document.getElementById('lotteryResult').classList.add('hidden');
    }
}

// 统一渲染所有内容
function renderAll() {
    renderParticipants();
    renderPrizes();
    renderHistory();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // 支持回车键快速添加
    document.getElementById('participantInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addParticipant();
    });
    
    document.getElementById('prizeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPrize();
    });
});