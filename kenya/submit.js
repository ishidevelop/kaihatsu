// document.addEventListener('DOMContentLoaded', function() {
//     // --- 全ての要素を最初に取得 ---
//     const step1 = document.getElementById('step1-name-selection');
//     const step2 = document.getElementById('step2-calendar-view');
//     const nextBtn = document.getElementById('next-step-btn');
//     const userNameSelect = document.getElementById('user-name');
//     const displayName = document.getElementById('display-name');
//     const calendarEl = document.getElementById('calendar');
//     const submitAllBtn = document.getElementById('submit-all-btn');
//     const modal = document.getElementById('time-modal');
//     const modalDateEl = document.getElementById('modal-date');
//     const startTimeSelect = document.getElementById('modal-start-time');
//     const endTimeSelect = document.getElementById('modal-end-time');
//     const saveBtn = document.getElementById('save-shift-btn');
//     const cancelBtn = document.getElementById('cancel-btn');

//     // --- 変数の初期化 ---
//     let selectedUserName = '';
//     let selectedShifts = [];
//     let currentSelectedDate = null;
//     let calendar;

//     // --- 関数の定義 ---

//     // 従業員リストを取得して、名前の選択肢を生成する関数
//     async function populateEmployeeOptions() {
//         try {
//             const response = await fetch('http://127.0.0.1:5000/employees');
//             if (!response.ok) {
//                 throw new Error('従業員リストの取得に失敗しました。');
//             }
//             const employees = await response.json();
//             employees.forEach(employee => {
//                 const option = document.createElement('option');
//                 option.value = employee.name;
//                 option.textContent = `${employee.name} (${employee.role || ''})`;
//                 userNameSelect.appendChild(option);
//             });
//         } catch (error) {
//             console.error(error);
//             alert('従業員リストの読み込みに失敗しました。ページを再読み込みしてください。');
//         }
//     }

//     // 時間選択肢の生成
//     function populateTimeOptions(selectElement) {
//         for (let i = 17; i <= 23; i++) {
//             const hour = i.toString().padStart(2, '0');
//             ['00', '30'].forEach(min => {
//                 if (i === 23 && min === '30') return;
//                 let option = document.createElement('option');
//                 option.value = `${hour}:${min}`;
//                 option.textContent = `${hour}:${min}`;
//                 selectElement.appendChild(option);
//             });
//         }
//     }

//     // カレンダーを初期化する関数
//     function initializeCalendar() {
//         calendar = new FullCalendar.Calendar(calendarEl, {
//             initialView: 'dayGridMonth',
//             locale: 'ja',
//             headerToolbar: {
//                 left: 'prev,next today',
//                 center: 'title',
//                 right: ''
//             },
//             dateClick: function(info) {
//                 currentSelectedDate = info.dateStr;
//                 modalDateEl.textContent = `${currentSelectedDate} の時間を選択`;
//                 modal.style.display = 'block';
//             }
//         });
//         calendar.render();
//     }

//     // --- イベントリスナーの設定 ---

//     // 「次へ」ボタンの処理
//     nextBtn.addEventListener('click', () => {
//         selectedUserName = userNameSelect.value;
//         if (!selectedUserName) {
//             alert('名前を選択してください。');
//             return;
//         }
//         displayName.textContent = selectedUserName;
//         step1.style.display = 'none';
//         step2.style.display = 'block';
//         initializeCalendar();
//     });

//     // モーダルの「OK」ボタンの処理
//     saveBtn.addEventListener('click', () => {
//         const newShift = {
//             userName: selectedUserName,
//             date: currentSelectedDate,
//             startTime: startTimeSelect.value,
//             endTime: endTimeSelect.value
//         };
//         selectedShifts.push(newShift);
//         calendar.addEvent({
//             title: `${newShift.startTime} - ${newShift.endTime}`,
//             start: newShift.date,
//             allDay: true
//         });
//         alert(`${newShift.date}のシフトをリストに追加しました。`);
//         modal.style.display = 'none';
//     });

//     // モーダルの「キャンセル」ボタン
//     cancelBtn.addEventListener('click', () => {
//         modal.style.display = 'none';
//     });

//     // 「全てのシフトを提出」ボタンの処理
//     submitAllBtn.addEventListener('click', async () => {
//         if (selectedShifts.length === 0) {
//             alert('提出するシフトがありません。');
//             return;
//         }

//         // ★★★ ここからが修正・統合部分 ★★★

//         // 1. 提出対象となる「次の期間」のIDを計算する
//         function getNextPeriodId() {
//             const today = new Date();
//             let year = today.getFullYear();
//             let month = today.getMonth() + 1;
//             let periodPart = 1; // 1:前半, 2:後半

//             if (today.getDate() <= 15) {
//                 // 今が月の前半なら、提出するのは「今月の後半」
//                 periodPart = 2;
//             } else {
//                 // 今が月の後半なら、提出するのは「来月の前半」
//                 month += 1;
//                 if (month > 12) { // 年をまたぐ場合
//                     month = 1;
//                     year += 1;
//                 }
//                 periodPart = 1;
//             }
//             return `${year}-${String(month).padStart(2, '0')}-${periodPart}`;
//         }

//         const periodId = getNextPeriodId();
//         console.log(`提出する期間ID: ${periodId}`);

//         // 2. fetchのURLを、期間IDを含むように変更して送信
//         try {
//             const response = await fetch(`http://127.0.0.1:5000/shifts?period=${periodId}`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(selectedShifts),
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.error || 'シフトの提出に失敗しました。');
//             }

//             const result = await response.json();
//             alert(result.message || 'シフトを提出しました！');
//             window.location.reload();

//         } catch (error) {
//             console.error('エラー:', error);
//             alert(`エラーが発生しました: ${error.message}`);
//         }
//         // ★★★ ここまでが修正・統合部分 ★★★
//     });

//     // --- 初期化処理 ---
//     populateTimeOptions(startTimeSelect);
//     populateTimeOptions(endTimeSelect);
//     populateEmployeeOptions();
// });

document.addEventListener('DOMContentLoaded', function() {
    // --- 全ての要素を最初に取得 ---
    const step1 = document.getElementById('step1-name-selection');
    const step2 = document.getElementById('step2-calendar-view');
    const nextBtn = document.getElementById('next-step-btn');
    const userNameSelect = document.getElementById('user-name');
    const displayName = document.getElementById('display-name');
    const calendarEl = document.getElementById('calendar');
    const submitAllBtn = document.getElementById('submit-all-btn');
    const modal = document.getElementById('time-modal');
    const modalDateEl = document.getElementById('modal-date');
    const startTimeSelect = document.getElementById('modal-start-time');
    const saveBtn = document.getElementById('save-shift-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const periodTitle = document.getElementById('period-title'); // ★提出期間のタイトル表示用

    // --- 変数の初期化 ---
    let selectedUserName = '';
    let selectedShifts = [];
    let currentSelectedDate = null;
    let calendar;

    // --- 関数の定義 ---

    // 従業員リストを取得して、名前の選択肢を生成する関数
    async function populateEmployeeOptions() {
        try {
            const response = await fetch('http://127.0.0.1:5000/employees');
            if (!response.ok) throw new Error('従業員リストの取得に失敗');
            const employees = await response.json();
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.name;
                option.textContent = `${employee.name} (${employee.role || ''})`;
                userNameSelect.appendChild(option);
            });
        } catch (error) {
            console.error(error);
            alert('従業員リストの読み込みに失敗しました。');
        }
    }

    // 時間選択肢の生成 (15分毎 + フリー)
    function populateTimeOptions(selectElement) {
        const freeOption = document.createElement('option');
        freeOption.value = 'フリー';
        freeOption.textContent = 'フリー';
        selectElement.appendChild(freeOption);

        for (let i = 17; i <= 23; i++) {
            const hour = i.toString().padStart(2, '0');
            ['00', '15', '30', '45'].forEach(min => {
                if (i === 23 && min !== '00') return;
                let option = document.createElement('option');
                option.value = `${hour}:${min}`;
                option.textContent = `${hour}:${min}`;
                selectElement.appendChild(option);
            });
        }
    }

    // ★★★ 提出期間を計算するヘルパー関数 ★★★
    function getNextPeriodInfo() {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth(); // 0から始まる月 (0=1月)
        let periodPart, periodName, startDate, endDate;

        if (today.getDate() <= 15) {
            // 今が月の前半なら、提出するのは「今月の後半」
            periodPart = 2;
            periodName = `${year}年 ${month + 1}月後半`;
            startDate = new Date(year, month, 16);
            endDate = new Date(year, month + 1, 0); // その月の最終日を取得
        } else {
            // 今が月の後半なら、提出するのは「来月の前半」
            month += 1;
            if (month > 11) { // 年をまたぐ場合
                month = 0;
                year += 1;
            }
            periodPart = 1;
            periodName = `${year}年 ${month + 1}月前半`;
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month, 15);
        }
        const periodId = `${year}-${String(month + 1).padStart(2, '0')}-${periodPart}`;
        return { periodId, periodName, startDate, endDate };
    }

    // ★★★ カレンダーを初期化する関数 (修正) ★★★
    function initializeCalendar() {
        const nextPeriod = getNextPeriodInfo();

        // タイトルに提出期間を表示
        periodTitle.textContent = `${nextPeriod.periodName}のシフトを提出してください`;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            initialDate: nextPeriod.startDate, // カレンダーの初期表示を提出月に設定
            locale: 'ja',
            headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
            
            // 日付セルを描画する際の処理を追加
            dayCellDidMount: function(info) {
                // 提出期間外の日付なら、無効化するクラスを追加
                if (info.date < nextPeriod.startDate || info.date > nextPeriod.endDate) {
                    info.el.classList.add('fc-day-disabled');
                }
            },

            dateClick: function(info) {
                // 無効化された日付はクリックしても何もしない
                if (info.dayEl.classList.contains('fc-day-disabled')) {
                    return;
                }
                currentSelectedDate = info.dateStr;
                modalDateEl.textContent = `${currentSelectedDate} の時間を選択`;
                modal.style.display = 'block';
            }
        });
        calendar.render();
    }

    // --- イベントリスナーの設定 ---

    nextBtn.addEventListener('click', () => {
        selectedUserName = userNameSelect.value;
        if (!selectedUserName) {
            alert('名前を選択してください。');
            return;
        }
        displayName.textContent = selectedUserName;
        step1.style.display = 'none';
        step2.style.display = 'block';
        initializeCalendar();
    });

    saveBtn.addEventListener('click', () => {
        const newShift = {
            userName: selectedUserName,
            date: currentSelectedDate,
            time: startTimeSelect.value,
            note: ""
        };
        selectedShifts.push(newShift);
        calendar.addEvent({
            title: newShift.time,
            start: newShift.date,
            allDay: true
        });
        alert(`${newShift.date}のシフトをリストに追加しました。`);
        modal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // ★★★ 「全てのシフトを提出」ボタンの処理 (修正) ★★★
    submitAllBtn.addEventListener('click', async () => {
        if (selectedShifts.length === 0) {
            alert('提出するシフトがありません。');
            return;
        }

        // 期間IDの計算をヘルパー関数に任せる
        const periodId = getNextPeriodInfo().periodId;

        try {
            const response = await fetch(`http://127.0.0.1:5000/shifts?period=${periodId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedShifts),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'シフトの提出に失敗しました。');
            }

            const result = await response.json();
            alert(result.message || 'シフトを提出しました！');
            window.location.reload();

        } catch (error) {
            console.error('エラー:', error);
            alert(`エラーが発生しました: ${error.message}`);
        }
    });

    // --- 初期化処理 ---
    populateTimeOptions(startTimeSelect);
    populateEmployeeOptions();
});
