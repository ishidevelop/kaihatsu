// document.addEventListener('DOMContentLoaded', async () => {
//     // --- データの準備 (バックエンド完成まではダミーデータを使用) ---
//     // APIから従業員リストを取得する
//     const employees = [
//         { name: "片山", role: "キッチン" }, { name: "北島", role: "ホール" },
//         { name: "松田", role: "キッチン" }, { name: "佐藤", role: "ホール" }
//         // ... 他の従業員
//     ];
//     // APIからシフトデータを取得する
//     const shiftsData = [
//         { userName: "北島", date: "2025-07-28", time: "16:00-一品" },
//         { userName: "佐藤", date: "2025-07-28", time: "17:00-TK" },
//     ];

//     // --- 表示順の並び替え ---
//     employees.sort((a, b) => {
//         if (a.role === 'ホール' && b.role === 'キッチン') return -1;
//         if (a.role === 'キッチン' && b.role === 'ホール') return 1;
//         return a.name.localeCompare(b.name, 'ja');
//     });

//     // --- データを使いやすい形に変換 ---
//     const shiftsByEmployee = {};
//     employees.forEach(emp => shiftsByEmployee[emp.name] = {});
//     shiftsData.forEach(shift => {
//         if (shiftsByEmployee[shift.userName]) {
//             shiftsByEmployee[shift.userName][shift.date] = shift.time;
//         }
//     });

//     // --- 表の動的生成 ---
//     const container = document.getElementById('shift-grid-container');
//     function createShiftGrid() {
//         // CSSでカーソルを変えるためのクラスを追加
//         let tableHTML = '<table id="shift-grid" class="view-only">';
        
//         // ヘッダー行（日付）の作成
//         tableHTML += '<thead><tr><th>名前</th>';
//         for (let day = 16; day <= 31; day++) { // 7月16日から31日まで
//             const date = new Date(2025, 6, day); // 7月は「6」
//             let thClass = '';
//             const dayOfWeek = date.getDay();

//             if (JapaneseHolidays.isHoliday(date)) {
//                 thClass = 'public-holiday';
//             } else if (dayOfWeek === 0) {
//                 thClass = 'weekend-sunday';
//             } else if (dayOfWeek === 6) {
//                 thClass = 'weekend-saturday';
//             }
//             tableHTML += `<th class="${thClass}">${day}</th>`;
//         }
//         tableHTML += '</tr></thead>';

//         // 各従業員の行を作成
//         tableHTML += '<tbody>';
//         employees.forEach(emp => {
//             tableHTML += `<tr><td>${emp.name}</td>`;
//             for (let day = 16; day <= 31; day++) {
//                 const dateStr = `2025-07-${day.toString().padStart(2, '0')}`;
//                 const date = new Date(2025, 6, day);
//                 const shiftTime = shiftsByEmployee[emp.name][dateStr] || "";
                
//                 let tdClass = '';
//                 const dayOfWeek = date.getDay();

//                 if (JapaneseHolidays.isHoliday(date)) {
//                     tdClass = 'public-holiday';
//                 } else if (dayOfWeek === 0) {
//                     tdClass = 'weekend-sunday';
//                 } else if (dayOfWeek === 6) {
//                     tdClass = 'weekend-saturday';
//                 }
                
//                 tableHTML += `
//                     <td class="shift-cell ${tdClass}">
//                         <div class="time-slot">${shiftTime.split('-')[0] || ''}</div>
//                         <div class="note-slot">${shiftTime.split('-')[1] || ''}</div>
//                     </td>
//                 `;
//             }
//             tableHTML += '</tr>';
//         });
//         tableHTML += '</tbody></table>';

//         container.innerHTML = tableHTML;
//     }

//     createShiftGrid(); // 表を生成してページに表示
// });

// document.addEventListener('DOMContentLoaded', () => {
//     // この関数が、データの取得から表の描画まで全てを行います
//     async function initializePage() {
//         try {
//             // --- ① 2つのAPIを同時に呼び出して、データを取得する ---
//             // ※注意: '/finalized-shifts' は確定版シフトを取得するAPIのエンドポイント（仮）です。
//             // バックエンド担当者が作った実際のエンドポイント名に書き換えてください。
//             const [employeesResponse, shiftsResponse] = await Promise.all([
//                 fetch('http://127.0.0.1:5000/employees'),
//                 fetch(`http://127.0.0.1:5000/finalized-shifts?period=${periodId}`) 
//             ]);

//             // もしどちらかの通信に失敗したら、エラーを投げる
//             if (!employeesResponse.ok || !shiftsResponse.ok) {
//                 throw new Error('データの取得に失敗しました。');
//             }

//             // 受け取ったデータをJSON形式に変換する
//             const employees = await employeesResponse.json();
//             const shiftsData = await shiftsResponse.json();

//             // --- ② 取得したデータを使って、表を描画する準備をする ---
            
//             // 従業員を役割で並び替え
//             employees.sort((a, b) => {
//                 if (a.role === 'ホール' && b.role === 'キッチン') return -1;
//                 if (a.role === 'キッチン' && b.role === 'ホール') return 1;
//                 return a.name.localeCompare(b.name, 'ja');
//             });

//             // データを使いやすい形に変換
//             const shiftsByEmployee = {};
//             employees.forEach(emp => shiftsByEmployee[emp.name] = {});
//             shiftsData.forEach(shift => {
//                 if (shiftsByEmployee[shift.userName]) {
//                     // ここでは下段の追加項目も考慮した形式に
//                     shiftsByEmployee[shift.userName][shift.date] = `${shift.startTime}-${shift.endTime}|${shift.note || ''}`;
//                 }
//             });

//             // --- ③ 準備したデータで表を描画する ---
//             createShiftGrid(employees, shiftsByEmployee);

//         } catch (error) {
//             console.error('初期化エラー:', error);
//             const container = document.getElementById('shift-grid-container');
//             container.innerHTML = '<p style="text-align: center; color: red;">シフト情報の読み込みに失敗しました。時間をおいて再度お試しください。</p>';
//         }
//     }

//     // 表を生成する関数
//     function createShiftGrid(employees, shiftsByEmployee) {
//         const container = document.getElementById('shift-grid-container');
//         let tableHTML = '<table id="shift-grid" class="view-only">';
        
//         // ヘッダー行
//         tableHTML += '<thead><tr><th>名前</th>';
//         for (let day = 16; day <= 31; day++) { // 仮に7月16日〜31日
//             const date = new Date(2025, 6, day);
//             let thClass = '';
//             const dayOfWeek = date.getDay();

//             if (JapaneseHolidays.isHoliday(date)) {
//                 thClass = 'public-holiday';
//             } else if (dayOfWeek === 0) {
//                 thClass = 'weekend-sunday';
//             } else if (dayOfWeek === 6) {
//                 thClass = 'weekend-saturday';
//             }
//             tableHTML += `<th class="${thClass}">${day}</th>`;
//         }
//         tableHTML += '</tr></thead>';

//         // 各従業員の行
//         tableHTML += '<tbody>';
//         employees.forEach(emp => {
//             tableHTML += `<tr><td>${emp.name}</td>`;
//             for (let day = 16; day <= 31; day++) {
//                 const dateStr = `2025-07-${day.toString().padStart(2, '0')}`;
//                 const shiftData = shiftsByEmployee[emp.name][dateStr] || "|";
//                 const [time, note] = shiftData.split('|');

//                 const date = new Date(2025, 6, day);
//                 let tdClass = '';
//                 const dayOfWeek = date.getDay();
//                 if (JapaneseHolidays.isHoliday(date)) { tdClass = 'public-holiday'; }
//                 else if (dayOfWeek === 0) { tdClass = 'weekend-sunday'; }
//                 else if (dayOfWeek === 6) { tdClass = 'weekend-saturday'; }

//                 tableHTML += `
//                     <td class="shift-cell ${tdClass}">
//                         <div class="time-slot">${time || ''}</div>
//                         <div class="note-slot">${note || ''}</div>
//                     </td>
//                 `;
//             }
//             tableHTML += '</tr>';
//         });
//         tableHTML += '</tbody></table>';

//         container.innerHTML = tableHTML;
//     }

//     // ページ読み込み時に初期化関数を実行
//     initializePage();
// });




// document.addEventListener('DOMContentLoaded', () => {
//     const periodSelect = document.getElementById('period-select');
//     const gridContainer = document.getElementById('shift-grid-container');
//     let employeesData = []; // 従業員データを保持

//     // --- 1. 期間を計算するヘルパー関数 ---
//     function getPeriodInfo(date) {
//         const year = date.getFullYear();
//         const month = date.getMonth() + 1;
//         if (date.getDate() <= 15) {
//             return { id: `${year}-${String(month).padStart(2, '0')}-1`, name: `${year}年 ${month}月前半` };
//         } else {
//             return { id: `${year}-${String(month).padStart(2, '0')}-2`, name: `${year}年 ${month}月後半` };
//         }
//     }

//     // --- 2. 期間選択のプルダウンを生成 ---
//     function populatePeriodSelector() {
//         const today = new Date();
//         const currentPeriod = getPeriodInfo(today);

//         // 過去2期間、現在、未来2期間の選択肢を生成
//         for (let i = -2; i <= 2; i++) {
//             const d = new Date(today);
//             // 月をずらす (15日を基準に半月単位で)
//             d.setDate(d.getDate() + (i * 15));
//             const period = getPeriodInfo(d);
            
//             const option = document.createElement('option');
//             option.value = period.id;
//             option.textContent = period.name;
            
//             // 重複しないように追加
//             if (!Array.from(periodSelect.options).some(opt => opt.value === option.value)) {
//                 periodSelect.appendChild(option);
//             }
//         }
//         // 現在の期間をデフォルトで選択状態にする
//         periodSelect.value = currentPeriod.id;
//     }

//     // --- 3. 指定された期間のデータを取得し、表を描画するメイン関数 ---
//     async function fetchAndRenderGrid(periodId) {
//         gridContainer.innerHTML = '<p>読み込み中...</p>';
//         try {
//             // 確定版シフトデータを取得
//             const shiftsRes = await fetch(`http://127.0.0.1:5000/final-shifts?period=${periodId}`);
//             const shiftsData = await shiftsRes.json();

//             // 従業員データとシフトデータを使って表を生成
//             createShiftGrid(employeesData, shiftsData);

//         } catch (error) {
//             console.error('Error fetching data:', error);
//             gridContainer.innerHTML = '<p style="color: red;">シフト情報の読み込みに失敗しました。</p>';
//         }
//     }

//     // --- 4. 表を生成する関数 (中身は以前のものを流用) ---
//     // function createShiftGrid(employees, shiftsData) {
//     //     // (以前のview.jsにあった表を生成するロジックをここに記述)
//     //     // ...
//     //     // この関数は、渡されたデータに基づいて表のHTMLを生成し、
//     //     // gridContainer.innerHTML に設定します。
//     //     // ...
//     // }

//     function createShiftGrid(employees, shiftsData) {
//         const container = document.getElementById('shift-grid-container');
//         let tableHTML = '<table id="shift-grid" class="view-only">';
        
//         // ヘッダー行
//         tableHTML += '<thead><tr><th>名前</th>';
//         for (let day = 16; day <= 31; day++) { // 仮に7月16日〜31日
//             const date = new Date(2025, 6, day);
//             let thClass = '';
//             const dayOfWeek = date.getDay();

//             if (JapaneseHolidays.isHoliday(date)) {
//                 thClass = 'public-holiday';
//             } else if (dayOfWeek === 0) {
//                 thClass = 'weekend-sunday';
//             } else if (dayOfWeek === 6) {
//                 thClass = 'weekend-saturday';
//             }
//             tableHTML += `<th class="${thClass}">${day}</th>`;
//         }
//         tableHTML += '</tr></thead>';

//         // 各従業員の行
//         tableHTML += '<tbody>';
//         employees.forEach(emp => {
//             tableHTML += `<tr><td>${emp.name}</td>`;
//             for (let day = 16; day <= 31; day++) {
//                 const dateStr = `2025-07-${day.toString().padStart(2, '0')}`;
//                 const shiftData = shiftsByEmployee[emp.name][dateStr] || "|";
//                 const [time, note] = shiftData.split('|');

//                 const date = new Date(2025, 6, day);
//                 let tdClass = '';
//                 const dayOfWeek = date.getDay();
//                 if (JapaneseHolidays.isHoliday(date)) { tdClass = 'public-holiday'; }
//                 else if (dayOfWeek === 0) { tdClass = 'weekend-sunday'; }
//                 else if (dayOfWeek === 6) { tdClass = 'weekend-saturday'; }

//                 tableHTML += `
//                     <td class="shift-cell ${tdClass}">
//                         <div class="time-slot">${time || ''}</div>
//                         <div class="note-slot">${note || ''}</div>
//                     </td>
//                 `;
//             }
//             tableHTML += '</tr>';
//         });
//         tableHTML += '</tbody></table>';

//         container.innerHTML = tableHTML;
//     }

//     // --- 5. 初期化処理 ---
//     async function initializePage() {
//         // まず全従業員リストを取得 (これは一度だけで良い)
//         try {
//             const employeesRes = await fetch('http://127.0.0.1:5000/employees');
//             employeesData = await employeesRes.json();
            
//             // 従業員を並び替え
//             employeesData.sort((a, b) => {
//                 if (a.role === 'ホール' && b.role === 'キッチン') return -1;
//                 if (a.role === 'キッチン' && b.role === 'ホール') return 1;
//                 return a.name.localeCompare(b.name, 'ja');
//             });

//             // 期間選択プルダウンを生成し、現在の期間のシフトを表示
//             populatePeriodSelector();
//             fetchAndRenderGrid(periodSelect.value);

//         } catch (error) {
//             alert('従業員情報の読み込みに失敗しました。');
//         }
//     }
    
//     // --- 6. イベントリスナー ---
//     // プルダウンの値が変わったら、表を再描画する
//     periodSelect.addEventListener('change', () => {
//         fetchAndRenderGrid(periodSelect.value);
//     });

//     // ページの初期化を実行
//     initializePage();
// });

// document.addEventListener('DOMContentLoaded', () => {
//     // --- ① DOM要素を取得 ---
//     const periodSelect = document.getElementById('period-select');
//     const gridContainer = document.getElementById('shift-grid-container');
    
//     // --- ② 複数の関数で共有する変数を定義 ---
//     let employeesData = []; // 従業員データを一度だけ取得して保持

//     // --- ③ メインの初期化関数 ---
//     async function initializePage() {
//         try {
//             // まず全従業員リストを取得 (これは一度だけで良い)
//             const employeesRes = await fetch('http://127.0.0.1:5000/employees');
//             if (!employeesRes.ok) throw new Error('従業員情報の読み込みに失敗しました。');
//             employeesData = await employeesRes.json();
            
//             // 従業員を役割で並び替え
//             employeesData.sort((a, b) => {
//                 if (a.role === 'ホール' && b.role === 'キッチン') return -1;
//                 if (a.role === 'キッチン' && b.role === 'ホール') return 1;
//                 return a.name.localeCompare(b.name, 'ja');
//             });

//             // 期間選択プルダウンを生成し、現在の期間のシフトを表示
//             populatePeriodSelector();
//             fetchAndRenderGrid(periodSelect.value);

//         } catch (error) {
//             alert(error.message);
//             console.error(error);
//         }
//     }
    
//     // --- ④ ヘルパー関数群 ---

//     // 日付オブジェクトから期間IDと表示名を生成する関数
//     function getPeriodInfo(date) {
//         const year = date.getFullYear();
//         const month = date.getMonth() + 1;
//         if (date.getDate() <= 15) {
//             return { id: `${year}-${String(month).padStart(2, '0')}-1`, name: `${year}年 ${month}月前半` };
//         } else {
//             return { id: `${year}-${String(month).padStart(2, '0')}-2`, name: `${year}年 ${month}月後半` };
//         }
//     }

//     // 期間選択のプルダウンメニューを生成する関数
//     function populatePeriodSelector() {
//         const today = new Date();
//         const currentPeriod = getPeriodInfo(today);

//         // 過去2期間、現在、未来2期間の選択肢を生成
//         const periods = new Map();
//         for (let i = -2; i <= 1; i++) {
//             const d = new Date(today);
//             d.setDate(d.getDate() + (i * 15));
//             const p = getPeriodInfo(d);
//             periods.set(p.id, p.name);
//         }
        
//         // プルダウンに選択肢を追加
//         periods.forEach((name, id) => {
//             const option = document.createElement('option');
//             option.value = id;
//             option.textContent = name;
//             periodSelect.appendChild(option);
//         });
        
//         // ★★★ デフォルトで「現在の期間」を選択状態にする ★★★
//         periodSelect.value = currentPeriod.id;
//     }

//     // 指定された期間のデータを取得し、表を描画するメイン関数
//     async function fetchAndRenderGrid(periodId) {
//         gridContainer.innerHTML = '<p>読み込み中...</p>';
//         try {
//             // ★★★ 確定版シフトデータを取得 (/final-shifts を使用) ★★★
//             const shiftsRes = await fetch(`http://127.0.0.1:5000/final-shifts?period=${periodId}`);
//             if (!shiftsRes.ok) throw new Error('確定シフトの取得に失敗しました。');
//             const shiftsData = await shiftsRes.json();

//             // 従業員データとシフトデータを使って表を生成
//             createShiftGrid(employeesData, shiftsData, periodId);

//         } catch (error) {
//             console.error('Error fetching data:', error);
//             gridContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
//         }
//     }

//     // 表を動的に生成する関数
//     function createShiftGrid(employees, shiftsData, periodId) {
//         const [year, month, part] = periodId.split('-').map(Number);
//         const startDate = (part === 1) ? 1 : 16;
//         const endDate = (part === 1) ? 15 : new Date(year, month, 0).getDate();

//         const shiftsByEmployee = {};
//         employees.forEach(emp => shiftsByEmployee[emp.name] = {});
//         shiftsData.forEach(shift => {
//             if (shiftsByEmployee[shift.userName]) {
//                 const time = shift.time || `${shift.startTime}-${shift.endTime}`;
//                 shiftsByEmployee[shift.userName][shift.date] = `${time}|${shift.note || ''}`;
//             }
//         });

//         let tableHTML = '<table id="shift-grid" class="view-only">';
//         tableHTML += '<thead><tr><th>名前</th>';
//         for (let day = startDate; day <= endDate; day++) {
//             const date = new Date(year, month - 1, day);
//             let thClass = '';
//             const dayOfWeek = date.getDay();
//             if (JapaneseHolidays.isHoliday(date)) thClass = 'public-holiday';
//             else if (dayOfWeek === 0) thClass = 'weekend-sunday';
//             else if (dayOfWeek === 6) thClass = 'weekend-saturday';
//             tableHTML += `<th class="${thClass}">${day}</th>`;
//         }
//         tableHTML += '</tr></thead><tbody>';
//         employees.forEach(emp => {
//             tableHTML += `<tr><td>${emp.name}</td>`;
//             for (let day = startDate; day <= endDate; day++) {
//                 const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//                 const shiftData = shiftsByEmployee[emp.name] && shiftsByEmployee[emp.name][dateStr] ? shiftsByEmployee[emp.name][dateStr] : "|";
//                 const [time, note] = shiftData.split('|');
//                 let tdClass = '';
//                 const date = new Date(year, month - 1, day);
//                 const dayOfWeek = date.getDay();
//                 if (JapaneseHolidays.isHoliday(date)) tdClass = 'public-holiday';
//                 else if (dayOfWeek === 0) tdClass = 'weekend-sunday';
//                 else if (dayOfWeek === 6) tdClass = 'weekend-saturday';
//                 tableHTML += `<td class="shift-cell ${tdClass}"><div class="time-slot">${time || ''}</div><div class="note-slot">${note || ''}</div></td>`;
//             }
//             tableHTML += '</tr>';
//         });
//         tableHTML += '</tbody></table>';

//         gridContainer.innerHTML = tableHTML;
//     }

//     // --- ⑤ イベントリスナー ---
//     // プルダウンの値が変わったら、表を再描画する
//     periodSelect.addEventListener('change', () => {
//         fetchAndRenderGrid(periodSelect.value);
//     });

//     // --- ⑥ 初期化処理の実行 ---
//     initializePage();
// });


document.addEventListener('DOMContentLoaded', () => {
    // --- ① DOM要素を取得 ---
    const displayArea = document.getElementById('shift-display-area');
    
    // --- ② 複数の関数で共有する変数を定義 ---
    let employeesData = []; // 従業員データを一度だけ取得して保持

    // --- ③ メインの初期化関数 ---
    async function initializePage() {
        displayArea.innerHTML = '<p>読み込み中...</p>';
        try {
            // まず全従業員リストを取得 (これは一度だけで良い)
            const employeesRes = await fetch('http://127.0.0.1:5000/employees');
            if (!employeesRes.ok) throw new Error('従業員情報の読み込みに失敗しました。');
            employeesData = await employeesRes.json();
            
            employeesData.sort((a, b) => {
                if (a.role === 'ホール' && b.role === 'キッチン') return -1;
                if (a.role === 'キッチン' && b.role === 'ホール') return 1;
                return a.name.localeCompare(b.name, 'ja');
            });

            // ★★★ 現在と次の期間のシフトを両方取得しにいく ★★★
            const today = new Date();
            const currentPeriod = getPeriodInfo(today);
            
            const nextPeriodDate = new Date(today);
            nextPeriodDate.setDate(today.getDate() + 16); // 16日後なら確実に次の期間
            const nextPeriod = getPeriodInfo(nextPeriodDate);

            const [currentShiftsRes, nextShiftsRes] = await Promise.all([
                fetch(`http://127.0.0.1:5000/final-shifts?period=${currentPeriod.id}`),
                fetch(`http://127.0.0.1:5000/final-shifts?period=${nextPeriod.id}`)
            ]);

            if (!currentShiftsRes.ok || !nextShiftsRes.ok) {
                throw new Error('確定シフトの取得に失敗しました。');
            }

            const currentShifts = await currentShiftsRes.json();
            const nextShifts = await nextShiftsRes.json();

            // --- 表示エリアをクリアしてから描画 ---
            displayArea.innerHTML = '';

            // 現在の期間のシフトを必ず表示
            renderShiftGrid(currentPeriod, currentShifts);

            // 次の期間のシフトが確定されていれば、それも表示
            if (nextShifts.length > 0) {
                renderShiftGrid(nextPeriod, nextShifts);
            }

        } catch (error) {
            displayArea.innerHTML = `<p style="color: red;">${error.message}</p>`;
            console.error(error);
        }
    }
    
    // --- ④ ヘルパー関数群 ---

    function getPeriodInfo(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        if (date.getDate() <= 15) {
            return { id: `${year}-${String(month).padStart(2, '0')}-1`, name: `${year}年 ${month}月前半` };
        } else {
            return { id: `${year}-${String(month).padStart(2, '0')}-2`, name: `${year}年 ${month}月後半` };
        }
    }

    // ★★★ 1つのシフト表を描画するための汎用関数 ★★★
    function renderShiftGrid(periodInfo, shiftsData) {
        const section = document.createElement('section');
        section.className = 'shift-period-section';

        const title = document.createElement('h1');
        title.textContent = `決定シフト (${periodInfo.name})`;
        section.appendChild(title);

        const gridContainer = document.createElement('div');
        section.appendChild(gridContainer);
        
        displayArea.appendChild(section);
        
        createShiftGrid(gridContainer, employeesData, shiftsData, periodInfo.id);
    }

    // 表を動的に生成する関数
    function createShiftGrid(container, employees, shiftsData, periodId) {
        const [year, month, part] = periodId.split('-').map(Number);
        const startDate = (part === 1) ? 1 : 16;
        const endDate = (part === 1) ? 15 : new Date(year, month, 0).getDate();

        const shiftsByEmployee = {};
        employees.forEach(emp => shiftsByEmployee[emp.name] = {});
        shiftsData.forEach(shift => {
            if (shiftsByEmployee[shift.userName]) {
                const time = shift.time || `${shift.startTime}-${shift.endTime}`;
                shiftsByEmployee[shift.userName][shift.date] = `${time}|${shift.note || ''}`;
            }
        });

        let tableHTML = '<table id="shift-grid" class="view-only">';
        tableHTML += '<thead><tr><th>名前</th>';
        for (let day = startDate; day <= endDate; day++) {
            const date = new Date(year, month - 1, day);
            let thClass = '';
            const dayOfWeek = date.getDay();
            if (JapaneseHolidays.isHoliday(date)) thClass = 'public-holiday';
            else if (dayOfWeek === 0) thClass = 'weekend-sunday';
            else if (dayOfWeek === 6) thClass = 'weekend-saturday';
            tableHTML += `<th class="${thClass}">${day}</th>`;
        }
        tableHTML += '</tr></thead><tbody>';
        employees.forEach(emp => {
            tableHTML += `<tr><td>${emp.name}</td>`;
            for (let day = startDate; day <= endDate; day++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const shiftData = shiftsByEmployee[emp.name] && shiftsByEmployee[emp.name][dateStr] ? shiftsByEmployee[emp.name][dateStr] : "|";
                const [time, note] = shiftData.split('|');
                let tdClass = '';
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.getDay();
                if (JapaneseHolidays.isHoliday(date)) tdClass = 'public-holiday';
                else if (dayOfWeek === 0) tdClass = 'weekend-sunday';
                else if (dayOfWeek === 6) tdClass = 'weekend-saturday';
                tableHTML += `<td class="shift-cell ${tdClass}"><div class="time-slot">${time || ''}</div><div class="note-slot">${note || ''}</div></td>`;
            }
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';

        container.innerHTML = tableHTML;
    }

    // --- ⑤ 初期化処理の実行 ---
    initializePage();
});
