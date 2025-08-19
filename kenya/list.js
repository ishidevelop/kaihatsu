// document.addEventListener('DOMContentLoaded', () => {

//     // --- 従業員管理の要素を取得 ---
//     const employeeForm = document.getElementById('employee-form');
//     const employeeNameInput = document.getElementById('employee-name');
//     const employeeRoleSelect = document.getElementById('employee-role');
//     const employeeListBody = document.getElementById('employee-list-body');
//     const saveDraftBtn = document.getElementById('save-draft-btn');
//     const saveFinalVersionBtn = document.getElementById('save-final-version-btn');

// // --- 関数定義 ---

//     // 従業員リストを取得して表示する関数
//     async function fetchAndDisplayEmployees() {
//         try {
//             const response = await fetch('http://127.0.0.1:5000/employees');
//             const employees = await response.json();

//             employeeListBody.innerHTML = ''; // 一旦リストを空にする
//             employees.forEach(employee => {
//                 const row = document.createElement('tr');
//                 row.innerHTML = `
//                     <td>${employee.name}</td>
//                     <td>${employee.role}</td>
//                     <td><button class="delete-btn" data-id="${employee.id}">削除</button></td>
//                 `;
//                 employeeListBody.appendChild(row);
//             });
//         } catch (error) {
//             console.error('従業員リストの取得に失敗:', error);
//         }
//     }

//     // --- イベントリスナーの設定 ---

//     // 従業員登録フォームの送信イベント
//     employeeForm.addEventListener('submit', async (event) => {
//         event.preventDefault();
//         const newEmployee = {
//             name: employeeNameInput.value,
//             role: employeeRoleSelect.value
//         };

//         try {
//             await fetch('http://127.0.0.1:5000/employees', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(newEmployee)
//             });
//             alert('従業員を登録しました。');
//             employeeForm.reset(); // フォームを空にする
//             fetchAndDisplayEmployees(); // リストを再表示
//         } catch (error) {
//             console.error('従業員の登録に失敗:', error);
//             alert('従業員の登録に失敗しました。');
//         }
//     });

//     // 従業員削除ボタンのクリックイベント (イベント委任)
//     employeeListBody.addEventListener('click', async (event) => {
//         if (event.target.classList.contains('delete-btn')) {
//             const employeeId = event.target.dataset.id;
//             if (confirm(`本当にこの従業員を削除しますか？`)) {
//                 try {
//                     await fetch(`http://127.0.0.1:5000/employees/${employeeId}`, {
//                         method: 'DELETE'
//                     });
//                     alert('従業員を削除しました。');
//                     fetchAndDisplayEmployees(); // リストを再表示
//                 } catch (error) {
//                     console.error('従業員の削除に失敗:', error);
//                     alert('従業員の削除に失敗しました。');
//                 }
//             }
//         }
//     });


//     async function initializePage() {
//         try {

//             // 期間IDを計算
//             const periodId = getCurrentPeriodId();

//             // --- ① 必要なデータを全て取得 ---
//             const [employeesRes, submittedShiftsRes, finalizedShiftsRes, draftShiftsRes] = await Promise.all([
//                 fetch(`http://127.0.0.1:5000/employees`),
//                 fetch(`http://127.0.0.1:5000/shifts?period=${periodId}`),
//                 fetch(`http://127.0.0.1:5000/final-shifts?period=${periodId}`),
//                 fetch(`http://127.0.0.1:5000/draft-shifts?period=${periodId}`) // ★下書きデータを取得
//             ]);

//             if (!employeesRes.ok) throw new Error('従業員APIエラー');
//             if (!submittedShiftsRes.ok) throw new Error('希望シフトAPIエラー');
//             if (!finalizedShiftsRes.ok) throw new Error('確定版シフトAPIエラー');
//             if (!draftShiftsRes.ok) throw new Error('下書きシフトAPIエラー');

//             const employees = await employeesRes.json();
//             const submittedShifts = await submittedShiftsRes.json();
//             const finalizedShifts = await finalizedShiftsRes.json();
//             const draftShifts = await draftShiftsRes.json(); // ★下書きデータ

//             // --- ② 従業員リストを並び替え ---
//             employees.sort((a, b) => {
//                 if (a.role === 'ホール' && b.role === 'キッチン') return -1;
//                 if (a.role === 'キッチン' && b.role === 'ホール') return 1;
//                 return a.name.localeCompare(b.name, 'ja');
//             });

//             // --- ③ 2つの表をそれぞれ描画 ---
//             // 閲覧用の表を描画 (提出された希望シフト)
//             createShiftGrid('submitted-shift-grid-container', employees, submittedShifts, false);

//             // ★編集用の表に表示するデータを、優先順位に従って決定
//             let editingData;
//             if (draftShifts && draftShifts.length > 0) {
//                 editingData = draftShifts; // 1. 下書きがあれば最優先
//                 console.log("下書きデータを読み込みました。");
//             } else if (finalizedShifts && finalizedShifts.length > 0) {
//                 editingData = finalizedShifts; // 2. 下書きがなければ確定版
//                 console.log("確定版データを読み込みました。");
//             } else {
//                 editingData = submittedShifts; // 3. どちらもなければ提出された希望
//                 console.log("提出された希望シフトを元に作成します。");
//             }
//             createShiftGrid('final-shift-grid-container', employees, editingData, true);
            
//             updateStaffingHighlight();

//         } catch (error) {
//             console.error('初期化エラー:', error);
//             alert('ページの読み込みに失敗しました。');
//         }
//     }

//     // (createShiftGrid関数やイベントリスナーは以前のものを流用)
//     // ...

//     // ★★★ 「下書き保存」ボタンの処理を新しく追加 ★★★
    
//     saveDraftBtn.addEventListener('click', async () => {
//         // 現在の表からデータを収集するロジック (save-final-version-btnと同じ)
//         const currentShifts = collectShiftsFromGrid();
        
//         try {
//             await fetch(`http://127.0.0.1:5000/draft-shifts?period=${periodId}`, { // ★下書き用のAPIエンドポイント
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(currentShifts),
//             });
//             alert('下書きを保存しました。');
//         } catch (error) {
//             alert('下書きの保存に失敗しました。');
//         }
//     });
    
//     // 表からデータを収集するヘルパー関数
//     function collectShiftsFromGrid() {
//         const shifts = [];
//         const dataRows = document.querySelectorAll('#shift-grid tbody tr');
//         dataRows.forEach(row => {
//             const employeeName = row.cells[0].textContent;
//             for (let i = 1; i < row.cells.length; i++) {
//                 const cell = row.cells[i];
//                 const timeText = cell.querySelector('.time-slot').textContent.trim();
//                 const noteText = cell.querySelector('.note-slot').textContent.trim();
//                 if (timeText && timeText !== '休み') {
//                     shifts.push({
//                         userName: employeeName,
//                         date: cell.dataset.date,
//                         time: timeText,
//                         note: noteText
//                     });
//                 }
//             }
//         });
//         return shifts;
//     }

//     initializePage();
    


//     function createShiftGrid() {
//         let tableHTML = '<table id="shift-grid">';
        
//         // ヘッダー行（日付）の作成
//         tableHTML += '<thead><tr><th>名前</th>';
//         for (let day = 16; day <= 31; day++) { // 7月16日から31日まで
//             // --- ▼ここから変更▼ ---
//             const date = new Date(2025, 6, day); // 月は0から始まるため、7月は「6」
//             let thClass = '';
//             const dayOfWeek = date.getDay(); // 0:日曜, 1:月曜, ..., 6:土曜

//             if (JapaneseHolidays.isHoliday(date)) {
//                 thClass = 'public-holiday';
//             } else if (dayOfWeek === 0) {
//                 thClass = 'weekend-sunday';
//             } else if (dayOfWeek === 6) {
//                 thClass = 'weekend-saturday';
//             }
//             tableHTML += `<th class="${thClass}">${day}</th>`;
//             // --- ▲ここまで変更▲ ---
//         }
//         tableHTML += '</tr></thead>';

//         // 各従業員の行を作成
//         tableHTML += '<tbody>';
//         employees.forEach(name => {
//             tableHTML += `<tr><td>${name}</td>`;
//             for (let day = 16; day <= 31; day++) {
//                 // --- ▼ここから変更▼ ---
//                 const dateStr = `2025-07-${day.toString().padStart(2, '0')}`;
//                 const date = new Date(2025, 6, day);
//                 const shiftTime = shiftsByEmployee[name][dateStr] || "";
                
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
//                     <td class="shift-cell ${tdClass}" data-date="${dateStr}" data-name="${name}">
//                         <div class="time-slot">${shiftTime.split('-')[0] || ''}</div>
//                         <div class="note-slot">${shiftTime.split('-')[1] || ''}</div>
//                     </td>
//                 `;
//                 // --- ▲ここまで変更▲ ---
//             }
//             tableHTML += '</tr>';
//         });
//         tableHTML += '</tbody></table>';

//         container.innerHTML = tableHTML;
//     }
//     // createShiftGrid(); // 表を生成してページに表示


//     // --- ③ 編集機能の実装 ---
//     container.addEventListener('click', function(event) {
//         const target = event.target;

//         // 上段（time-slot）がクリックされた時の処理
//         if (target.classList.contains('time-slot')) {
//             const cell = target.closest('.shift-cell');
//             // 他のセルが編集中なら、先に元に戻す
//             document.querySelectorAll('.shift-cell select, .shift-cell input').forEach(el => el.blur());
//             makeTimeEditable(cell);
//         }
//         // ▼▼▼ この部分を追記 ▼▼▼
//         // 下段（note-slot）がクリックされた時の処理
//         else if (target.classList.contains('note-slot')) {
//             const cell = target.closest('.shift-cell');
//             // 他のセルが編集中なら、先に元に戻す
//             document.querySelectorAll('.shift-cell select, .shift-cell input').forEach(el => el.blur());
//             makeNoteEditable(cell);
//         }
//         // ▲▲▲ ここまで追記 ▲▲▲
//     });

//     // 上段を編集可能にする関数 (名前をmakeTimeEditableに変更)
//     function makeTimeEditable(cell) {
//         const timeSlot = cell.querySelector('.time-slot');
//         const originalTime = timeSlot.textContent;
        
//         // 編集用のプルダウンを作成
//         const select = document.createElement('select');
//         const timeOptions = ["", "休み", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
//         timeOptions.forEach(time => {
//             const option = document.createElement('option');
//             option.value = time;
//             option.textContent = time;
//             if (time === originalTime) {
//                 option.selected = true;
//             }
//             select.appendChild(option);
//         });
        
//         timeSlot.innerHTML = '';
//         timeSlot.appendChild(select);
//         select.focus();

//         // プルダウンからフォーカスが外れたら元に戻す
//         select.addEventListener('blur', function() {
//             timeSlot.textContent = select.value;
//         });

//             function updateCell() {
//                 timeSlot.textContent = select.value;
//                 updateStaffingHighlight(); // ★編集が終わるたびに人数チェックを再実行
//             }
            
//             select.addEventListener('blur', updateCell);
//             select.addEventListener('change', updateCell);
        
//     }

//     // 下段に関する関数
//     // 下段を編集可能にする関数
//     function makeNoteEditable(cell) {
//         const noteSlot = cell.querySelector('.note-slot');
//         const originalText = noteSlot.textContent;

//         // 編集用のテキストボックスを作成
//         const input = document.createElement('input');
//         input.type = 'text';
//         input.value = originalText;
//         input.style.width = '95%'; // セルに収まるように調整

//         // 元のテキストをテキストボックスに置き換える
//         noteSlot.innerHTML = '';
//         noteSlot.appendChild(input);
//         input.focus();

//         // テキストボックスからフォーカスが外れたら、元の表示に戻す
//         input.addEventListener('blur', function() {
//             noteSlot.textContent = input.value;
//         });

//         // Enterキーが押されても、元の表示に戻す
//         input.addEventListener('keydown', function(event) {
//             if (event.key === 'Enter') {
//                 input.blur(); // blurイベントを発火させる
//             }
//         });
//     }

//     function updateStaffingHighlight() {
//         const headerCells = document.querySelectorAll('#shift-grid thead th');
//         const dataRows = document.querySelectorAll('#shift-grid tbody tr');

//         // ヘッダー行をループ (最初の「名前」セルは除く)
//         for (let i = 1; i < headerCells.length; i++) {
//             const th = headerCells[i];
//             const day = parseInt(th.textContent, 10);
//             const date = new Date(2025, 6, day); // 7月は「6」

//             // 1. その日の出勤人数を数える
//             let staffCount = 0;
//             dataRows.forEach(row => {
//                 const cell = row.cells[i];
//                 const timeSlot = cell.querySelector('.time-slot');
//                 if (timeSlot && timeSlot.textContent && timeSlot.textContent !== '休み') {
//                     staffCount++;
//                 }
//             });

//             // 2. Aの日かBの日かを判定する
//             const nextDay = new Date(date);
//             nextDay.setDate(date.getDate() + 1);
//             const nextDayOfWeek = nextDay.getDay(); // 0:日曜, 6:土曜
            
//             let requiredStaff;
//             // 次の日が土曜、日曜、または祝日の場合 (Aの日)
//             if (nextDayOfWeek === 6 || nextDayOfWeek === 0 || JapaneseHolidays.isHoliday(nextDay)) {
//                 requiredStaff = 10;
//             } else { // 次の日が平日の場合 (Bの日)
//                 requiredStaff = 8;
//             }

//             console.log(`日付: ${day}日 | 出勤: ${staffCount}人 | 目安: ${requiredStaff}人`);

//             // 3. 人数比較と色付け
//             if (staffCount < requiredStaff) {
//                 th.classList.add('understaffed-column');
//             } else {
//                 th.classList.remove('understaffed-column');
//             }
//         }
//     }

//     // ボタンのクリックイベントリスナーを追加
//     saveFinalVersionBtn.addEventListener('click', async () => {
//         // 確認ダイアログを表示
//         if (!confirm('現在の内容でシフトを確定しますか？この操作は元に戻せません。')) {
//             return; // ユーザーがキャンセルしたら何もしない
//         }

//         const finalizedShifts = [];
//         const dataRows = document.querySelectorAll('#shift-grid tbody tr');

//         // 表の各行（各従業員）をループ
//         dataRows.forEach(row => {
//             const employeeName = row.cells[0].textContent;
            
//             // 各日付のセルをループ (最初の「名前」セルは除く)
//             for (let i = 1; i < row.cells.length; i++) {
//                 const cell = row.cells[i];
//                 const timeText = cell.querySelector('.time-slot').textContent.trim();
//                 const noteText = cell.querySelector('.note-slot').textContent.trim();
                
//                 // 時間が入力されている（「休み」や空ではない）セルだけをデータとして収集
//                 if (timeText && timeText !== '休み') {
//                     const shiftData = {
//                         userName: employeeName,
//                         date: cell.dataset.date, // セルに埋め込んだdata-date属性から日付を取得
//                         time: timeText,          // 上段のテキストをそのまま保存
//                         note: noteText           // 下段のテキストをそのまま保存
//                     };
//                     finalizedShifts.push(shiftData);
//                 }
//             }
//         });

//         console.log('確定版シフトとして送信するデータ:', finalizedShifts); // 送信するデータを確認

//         try {
//             // バックエンドに確定版シフトデータを送信する
//             const response = await fetch(`http://127.0.0.1:5000/finalized-shifts?period=${periodId}`, { // ★新しいAPIエンドポイント
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(finalizedShifts),
//             });

//             if (!response.ok) {
//                 throw new Error('シフトの確定に失敗しました。');
//             }

//             const result = await response.json();
//             alert(result.message || 'シフトを確定しました！');
            
//         } catch (error) {
//             console.error('エラー:', error);
//             alert('エラーが発生しました。シフトを確定できませんでした。');
//         }
//     });
// });

// document.addEventListener('DOMContentLoaded', () => {
//     // --- ① 全てのDOM要素を最初に取得 ---
//     const employeeForm = document.getElementById('employee-form');
//     const employeeNameInput = document.getElementById('employee-name');
//     const employeeRoleSelect = document.getElementById('employee-role');
//     const employeeListBody = document.getElementById('employee-list-body');
//     const saveDraftBtn = document.getElementById('save-draft-btn');
//     const saveFinalVersionBtn = document.getElementById('save-final-version-btn');
//     const submittedGridContainer = document.getElementById('submitted-shift-grid-container');
//     const finalGridContainer = document.getElementById('final-shift-grid-container');

//     // --- ② 複数の関数で共有する変数を定義 ---
//     let periodId = ''; // 現在表示している期間IDを保持

//     // --- ③ メインの初期化関数 ---
//     async function initializePage() {
//         try {
//             // 現在の期間IDを計算
//             periodId = getCurrentPeriodId();
            
//             // 必要なデータを全て並行して取得
//             const [employeesRes, submittedShiftsRes, finalizedShiftsRes, draftShiftsRes] = await Promise.all([
//                 fetch(`http://127.0.0.1:5000/employees`),
//                 fetch(`http://127.0.0.1:5000/shifts?period=${periodId}`),
//                 fetch(`http://127.0.0.1:5000/final-shifts?period=${periodId}`),
//                 fetch(`http://127.0.0.1:5000/draft-shifts?period=${periodId}`)
//             ]);

//             if (!employeesRes.ok) throw new Error('従業員APIエラー');
//             if (!submittedShiftsRes.ok) throw new Error('希望シフトAPIエラー');
//             if (!finalizedShiftsRes.ok) throw new Error('確定版シフトAPIエラー');
//             if (!draftShiftsRes.ok) throw new Error('下書きシフトAPIエラー');

//             const employees = await employeesRes.json();
//             const submittedShifts = await submittedShiftsRes.json();
//             const finalizedShifts = await finalizedShiftsRes.json();
//             const draftShifts = await draftShiftsRes.json();

//             // 従業員リストを並び替え
//             employees.sort((a, b) => {
//                 if (a.role === 'ホール' && b.role === 'キッチン') return -1;
//                 if (a.role === 'キッチン' && b.role === 'ホール') return 1;
//                 return a.name.localeCompare(b.name, 'ja');
//             });

//             // 2つの表をそれぞれ描画
//             createShiftGrid('submitted-shift-grid-container', employees, submittedShifts, false);

//             let editingData;
//             if (draftShifts && draftShifts.length > 0) editingData = draftShifts;
//             else if (finalizedShifts && finalizedShifts.length > 0) editingData = finalizedShifts;
//             else editingData = submittedShifts;
            
//             createShiftGrid('final-shift-grid-container', employees, editingData, true);
            
//             updateStaffingHighlight();

//         } catch (error) {
//             console.error('初期化エラー:', error);
//             alert('ページの読み込みに失敗しました。');
//         }
//     }

//     // --- ④ ヘルパー関数群 ---

//     function getCurrentPeriodId() {
//         const today = new Date();
//         const year = today.getFullYear();
//         const month = today.getMonth() + 1;
//         return today.getDate() <= 15 ? `${year}-${String(month).padStart(2, '0')}-1` : `${year}-${String(month).padStart(2, '0')}-2`;
//     }

//     function createShiftGrid(containerId, employees, shiftsData, isEditable) {
//         const container = document.getElementById(containerId);
//         if (!container) return;

//         const shiftsByEmployee = {};
//         employees.forEach(emp => shiftsByEmployee[emp.name] = {});
//         shiftsData.forEach(shift => {
//             if (shiftsByEmployee[shift.userName]) {
//                 const time = shift.time || `${shift.startTime}-${shift.endTime}`;
//                 shiftsByEmployee[shift.userName][shift.date] = `${time}|${shift.note || ''}`;
//             }
//         });

//         let tableHTML = `<table id="${isEditable ? 'shift-grid' : 'submitted-grid'}" class="${isEditable ? '' : 'view-only'}">`;
//         tableHTML += '<thead><tr><th>名前</th>';
//         for (let day = 16; day <= 31; day++) {
//             const date = new Date(2025, 6, day);
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
//             for (let day = 16; day <= 31; day++) {
//                 const dateStr = `2025-07-${String(day).padStart(2, '0')}`;
//                 const shiftData = shiftsByEmployee[emp.name] && shiftsByEmployee[emp.name][dateStr] ? shiftsByEmployee[emp.name][dateStr] : "|";
//                 const [time, note] = shiftData.split('|');
//                 let tdClass = '';
//                 const date = new Date(2025, 6, day);
//                 const dayOfWeek = date.getDay();
//                 if (JapaneseHolidays.isHoliday(date)) tdClass = 'public-holiday';
//                 else if (dayOfWeek === 0) tdClass = 'weekend-sunday';
//                 else if (dayOfWeek === 6) tdClass = 'weekend-saturday';
//                 tableHTML += `<td class="shift-cell ${tdClass}" data-date="${dateStr}" data-name="${emp.name}"><div class="time-slot">${time || ''}</div><div class="note-slot">${note || ''}</div></td>`;
//             }
//             tableHTML += '</tr>';
//         });
//         tableHTML += '</tbody></table>';
//         container.innerHTML = tableHTML;
//     }

//     // (updateStaffingHighlight, makeTimeEditable, makeNoteEditable, collectShiftsFromGridなどの関数をここに記述)
//     // ...

//     // --- ⑤ イベントリスナー ---
//     employeeForm.addEventListener('submit', async (event) => { /* ... 従業員登録処理 ... */ });
//     employeeListBody.addEventListener('click', async (event) => { /* ... 従業員削除処理 ... */ });
    
//     saveDraftBtn.addEventListener('click', async () => {
//         const currentShifts = collectShiftsFromGrid();
//         try {
//             await fetch(`http://127.0.0.1:5000/draft-shifts?period=${periodId}`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(currentShifts),
//             });
//             alert('下書きを保存しました。');
//         } catch (error) {
//             alert('下書きの保存に失敗しました。');
//         }
//     });

//     saveFinalVersionBtn.addEventListener('click', async () => {
//         if (!confirm('この内容でシフトを確定しますか？')) return;
//         const currentShifts = collectShiftsFromGrid();
//         try {
//             await fetch(`http://127.0.0.1:5000/final-shifts?period=${periodId}`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(currentShifts),
//             });
//             alert('シフトを確定しました！');
//         } catch (error) {
//             alert('シフトの確定に失敗しました。');
//         }
//     });

//     finalGridContainer.addEventListener('click', function(event) {
//         // ... (編集用の表のクリックイベント処理) ...
//     });

//     // --- ⑥ 初期化処理の実行 ---
//     initializePage();
//     // fetchAndDisplayEmployees(); // initializePageに統合されたので不要
// });

document.addEventListener('DOMContentLoaded', () => {
    // --- ① 全てのDOM要素を最初に取得 ---
    const employeeForm = document.getElementById('employee-form');
    const employeeNameInput = document.getElementById('employee-name');
    const employeeRoleSelect = document.getElementById('employee-role');
    const employeeListBody = document.getElementById('employee-list-body');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const saveFinalVersionBtn = document.getElementById('save-final-version-btn');
    const submittedGridContainer = document.getElementById('submitted-shift-grid-container');
    const finalGridContainer = document.getElementById('final-shift-grid-container');

    // --- ② 複数の関数で共有する変数を定義 ---
    let periodId = ''; // 現在表示している期間IDを保持

    // --- ③ メインの初期化関数 ---
    async function initializePage() {
        try {
            periodId = getTargetEditingPeriodId(); // ★★★ 呼び出す関数名を変更 ★★★
            
            const [employeesRes, submittedShiftsRes, finalizedShiftsRes, draftShiftsRes] = await Promise.all([
                fetch(`http://127.0.0.1:5000/employees`),
                fetch(`http://127.0.0.1:5000/shifts?period=${periodId}`),
                fetch(`http://127.0.0.1:5000/final-shifts?period=${periodId}`),
                fetch(`http://127.0.0.1:5000/draft-shifts?period=${periodId}`)
            ]);

            if (!employeesRes.ok) throw new Error(`従業員APIエラー: ${employeesRes.status}`);
            if (!submittedShiftsRes.ok) throw new Error(`希望シフトAPIエラー: ${submittedShiftsRes.status}`);
            if (!finalizedShiftsRes.ok) throw new Error(`確定版シフトAPIエラー: ${finalizedShiftsRes.status}`);
            if (!draftShiftsRes.ok) throw new Error(`下書きシフトAPIエラー: ${draftShiftsRes.status}`);

            const employees = await employeesRes.json();
            const submittedShifts = await submittedShiftsRes.json();
            const finalizedShifts = await finalizedShiftsRes.json();
            const draftShifts = await draftShiftsRes.json();

            employees.sort((a, b) => {
                if (a.role === 'ホール' && b.role === 'キッチン') return -1;
                if (a.role === 'キッチン' && b.role === 'ホール') return 1;
                return a.name.localeCompare(b.name, 'ja');
            });

            createShiftGrid('submitted-shift-grid-container', employees, submittedShifts, false, periodId);

            let editingData;
            if (draftShifts && draftShifts.length > 0) editingData = draftShifts;
            else if (finalizedShifts && finalizedShifts.length > 0) editingData = finalizedShifts;
            else editingData = submittedShifts;
            
            createShiftGrid('final-shift-grid-container', employees, editingData, true, periodId);
            
            updateStaffingHighlight(periodId);
            fetchAndDisplayEmployees();

        } catch (error) {
            console.error('初期化エラー:', error);
            alert('ページの読み込みに失敗しました。バックエンドサーバーが起動しているか、コンソールログを確認してください。');
        }
    }

    // --- ④ ヘルパー関数群 ---

    // ★★★ この関数を「次に編集すべき期間」を計算するように修正 ★★★
    function getTargetEditingPeriodId() {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        let periodPart = 1; // 1:前半, 2:後半

        if (today.getDate() <= 15) {
            // 今が月の前半なら、編集するのは「今月の後半」
            periodPart = 2;
        } else {
            // 今が月の後半なら、編集するのは「来月の前半」
            month += 1;
            if (month > 12) { // 年をまたぐ場合
                month = 1;
                year += 1;
            }
            periodPart = 1;
        }
        return `${year}-${String(month).padStart(2, '0')}-${periodPart}`;
    }

    function createShiftGrid(containerId, employees, shiftsData, isEditable, periodId) {
        const container = document.getElementById(containerId);
        if (!container) return;

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

        let tableHTML = `<table id="${isEditable ? 'shift-grid' : 'submitted-grid'}" class="${isEditable ? '' : 'view-only'}">`;
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
                tableHTML += `<td class="shift-cell ${tdClass}" data-date="${dateStr}" data-name="${emp.name}"><div class="time-slot">${time || ''}</div><div class="note-slot">${note || ''}</div></td>`;
            }
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    function updateStaffingHighlight(periodId) {
        const headerCells = document.querySelectorAll('#shift-grid thead th');
        const dataRows = document.querySelectorAll('#shift-grid tbody tr');
        if (headerCells.length === 0) return;

        const [year, month] = periodId.split('-').map(Number);

        for (let i = 1; i < headerCells.length; i++) {
            const th = headerCells[i];
            const day = parseInt(th.textContent, 10);
            const date = new Date(year, month - 1, day);

            let staffCount = 0;
            dataRows.forEach(row => {
                const cell = row.cells[i];
                if (cell) {
                    const timeSlot = cell.querySelector('.time-slot');
                    if (timeSlot && timeSlot.textContent && timeSlot.textContent !== '休み') {
                        staffCount++;
                    }
                }
            });

            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            const nextDayOfWeek = nextDay.getDay();
            
            let requiredStaff;
            if (nextDayOfWeek === 6 || nextDayOfWeek === 0 || JapaneseHolidays.isHoliday(nextDay)) {
                requiredStaff = 10;
            } else {
                requiredStaff = 8;
            }

            if (staffCount < requiredStaff) {
                th.classList.add('understaffed-column');
            } else {
                th.classList.remove('understaffed-column');
            }
        }
    }

    function makeTimeEditable(cell) {
        const timeSlot = cell.querySelector('.time-slot');
        const originalTime = timeSlot.textContent;
        const select = document.createElement('select');
        const timeOptions = ["", "休み", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
        timeOptions.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            if (time === originalTime) option.selected = true;
            select.appendChild(option);
        });
        timeSlot.innerHTML = '';
        timeSlot.appendChild(select);
        select.focus();
        const updateCell = () => {
            timeSlot.textContent = select.value;
            updateStaffingHighlight(periodId);
        };
        select.addEventListener('blur', updateCell);
        select.addEventListener('change', updateCell);
    }

    function makeNoteEditable(cell) {
        const noteSlot = cell.querySelector('.note-slot');
        const originalText = noteSlot.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.style.width = '95%';
        noteSlot.innerHTML = '';
        noteSlot.appendChild(input);
        input.focus();
        const updateCell = () => {
            noteSlot.textContent = input.value;
        };
        input.addEventListener('blur', updateCell);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') input.blur();
        });
    }
    
    function collectShiftsFromGrid() {
        const shifts = [];
        const dataRows = document.querySelectorAll('#shift-grid tbody tr');
        dataRows.forEach(row => {
            const employeeName = row.cells[0].textContent;
            for (let i = 1; i < row.cells.length; i++) {
                const cell = row.cells[i];
                const timeText = cell.querySelector('.time-slot').textContent.trim();
                const noteText = cell.querySelector('.note-slot').textContent.trim();
                if (timeText && timeText !== '休み') {
                    shifts.push({
                        userName: employeeName,
                        date: cell.dataset.date,
                        time: timeText,
                        note: noteText
                    });
                }
            }
        });
        return shifts;
    }

    async function fetchAndDisplayEmployees() {
        try {
            const response = await fetch('http://127.0.0.1:5000/employees');
            const employees = await response.json();
            employeeListBody.innerHTML = '';
            employees.forEach(employee => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${employee.name}</td><td>${employee.role}</td><td><button class="delete-btn" data-id="${employee.id}">削除</button></td>`;
                employeeListBody.appendChild(row);
            });
        } catch (error) {
            console.error('従業員リストの取得に失敗:', error);
        }
    }

    // --- ⑤ イベントリスナー ---
    employeeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newEmployee = { name: employeeNameInput.value, role: employeeRoleSelect.value };
        try {
            await fetch('http://127.0.0.1:5000/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee)
            });
            alert('従業員を登録しました。');
            employeeForm.reset();
            fetchAndDisplayEmployees();
        } catch (error) {
            alert('従業員の登録に失敗しました。');
        }
    });

    employeeListBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const employeeId = event.target.dataset.id;
            if (confirm(`本当にこの従業員を削除しますか？`)) {
                try {
                    await fetch(`http://127.0.0.1:5000/employees/${employeeId}`, { method: 'DELETE' });
                    alert('従業員を削除しました。');
                    fetchAndDisplayEmployees();
                } catch (error) {
                    alert('従業員の削除に失敗しました。');
                }
            }
        }
    });
    
    saveDraftBtn.addEventListener('click', async () => {
        const currentShifts = collectShiftsFromGrid();
        try {
            await fetch(`http://127.0.0.1:5000/draft-shifts?period=${periodId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentShifts),
            });
            alert('下書きを保存しました。');
        } catch (error) {
            alert('下書きの保存に失敗しました。');
        }
    });

    saveFinalVersionBtn.addEventListener('click', async () => {
        if (!confirm('この内容でシフトを確定しますか？')) return;
        const currentShifts = collectShiftsFromGrid();
        try {
            await fetch(`http://127.0.0.1:5000/final-shifts?period=${periodId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentShifts),
            });
            alert('シフトを確定しました！');
        } catch (error) {
            alert('シフトの確定に失敗しました。');
        }
    });

    finalGridContainer.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('time-slot')) {
            const cell = target.closest('.shift-cell');
            document.querySelectorAll('.shift-cell select, .shift-cell input').forEach(el => el.blur());
            makeTimeEditable(cell);
        } else if (target.classList.contains('note-slot')) {
            const cell = target.closest('.shift-cell');
            document.querySelectorAll('.shift-cell select, .shift-cell input').forEach(el => el.blur());
            makeNoteEditable(cell);
        }
    });

    // --- ⑥ 初期化処理の実行 ---
    initializePage();
});
